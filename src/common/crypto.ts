import type { SymEncrypted } from '../server/types'
import { serializeBuffer } from './base64'
import { textToBuffer } from './utils'

const crypto = globalThis.crypto

const CONSTANTS = Object.freeze({
	keyDerivationAlgorithm: 'PBKDF2',
	hashAlgorithm: 'SHA-512',
	iterations: 310_000,
	symmetricalEncryptionAlgorithm: 'AES-GCM',
	symmetricalEncryptionAlgorithmKeyLength: 256,
	symmetricalEncryptionAlgorithmIVLength: 16,
	asymmetricalEncryptionAlgorithm: 'RSA-OAEP',
	asymmetricalEncryptionAlgorithmKeyLength: 4096,
	voidSymmetricalIV: new Uint8Array(16).fill(0),
	saltBytesLength: 16,
	pepperBytesLength: 16,
})

export function generateRandomUUID(): string {
	return crypto.randomUUID()
}

export function generateRandomBuffer(bytes: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(bytes))
}

export function generateSalt(): Uint8Array {
	return generateRandomBuffer(CONSTANTS.saltBytesLength)
}

export async function hash(data: string): Promise<string> {
	const digest = await crypto.subtle.digest(CONSTANTS.hashAlgorithm, textToBuffer(data))

	return serializeBuffer(new Uint8Array(digest))
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
	const baseKey = await crypto.subtle.importKey('raw', textToBuffer(password), 'PBKDF2', false, ['deriveKey'])

	return crypto.subtle.deriveKey(
		{
			name: CONSTANTS.keyDerivationAlgorithm,
			hash: CONSTANTS.hashAlgorithm,
			iterations: CONSTANTS.iterations,
			salt,
		},
		baseKey,
		{
			name: CONSTANTS.symmetricalEncryptionAlgorithm,
			length: CONSTANTS.symmetricalEncryptionAlgorithmKeyLength,
		},
		true,
		['encrypt', 'decrypt'],
	)
}

export async function generateSymmetricKey() {
	return crypto.subtle.generateKey(
		{
			name: CONSTANTS.symmetricalEncryptionAlgorithm,
			length: CONSTANTS.symmetricalEncryptionAlgorithmKeyLength,
		},
		true,
		['encrypt', 'decrypt'],
	)
}

export async function encryptSym(data: Uint8Array, secretKey: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
	return new Uint8Array(
		await crypto.subtle.encrypt({ name: CONSTANTS.symmetricalEncryptionAlgorithm, iv }, secretKey, data),
	)
}

export async function decryptSym(encrypted: Uint8Array, secretKey: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
	try {
		const decrypted = await crypto.subtle.decrypt(
			{
				name: CONSTANTS.symmetricalEncryptionAlgorithm,
				iv,
			},
			secretKey,
			encrypted,
		)

		return new Uint8Array(decrypted)
	} catch (e: unknown) {
		throw new Error(`Failed to perform symmetrical decryption: ${e instanceof Error ? e.message : '<unknown error>'}`)
	}
}

export async function encryptSymForTRPC(data: Uint8Array, secretKey: CryptoKey): Promise<SymEncrypted> {
	const iv = generateIV()
	const content = await encryptSym(data, secretKey, iv)

	return { content: serializeBuffer(content), iv: serializeBuffer(iv) }
}

export function parseJWK(encoded: string): JsonWebKey {
	// TODO: parse with Zod
	return JSON.parse(encoded)
}

export async function importSymKey(key: JsonWebKey, exportable = false): Promise<CryptoKey> {
	return await crypto.subtle.importKey('jwk', key, { name: CONSTANTS.symmetricalEncryptionAlgorithm }, exportable, [
		'encrypt',
		'decrypt',
	])
}

export async function exportKey(key: CryptoKey): Promise<string> {
	return JSON.stringify(await crypto.subtle.exportKey('jwk', key))
}

export function generateIV(): Uint8Array {
	return generateRandomBuffer(CONSTANTS.symmetricalEncryptionAlgorithmIVLength)
}
