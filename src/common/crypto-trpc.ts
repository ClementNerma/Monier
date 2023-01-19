import type { SymEncrypted } from '../server/types'
import { deserializeBuffer, serializeBuffer } from './base64'
import { decryptAsym, decryptSym, encryptSym, generateIV, importKey, parseJWK } from './crypto'
import { bufferToText, textToBuffer } from './utils'

const importedKeys = new Map<string, CryptoKey>()

export async function encryptSymForTRPC(data: Uint8Array, secretKey: CryptoKey): Promise<SymEncrypted> {
	const iv = generateIV()
	const content = await encryptSym(data, secretKey, iv)

	return { content: serializeBuffer(content), iv: serializeBuffer(iv) }
}

export async function encryptTextSymForTRPC(data: string, secretKey: CryptoKey): Promise<SymEncrypted> {
	return encryptSymForTRPC(textToBuffer(data), secretKey)
}

export async function decryptSymFromTRPC(data: string, iv: string, secretKey: CryptoKey): Promise<Uint8Array | Error> {
	const encrypted = deserializeBuffer(data)

	if (encrypted instanceof Error) {
		return new Error('Failed to deserialize the encrypted data buffer')
	}

	const ivBuffer = deserializeBuffer(iv)

	if (ivBuffer instanceof Error) {
		return new Error('Failed to deserialize the IV buffer')
	}

	const decrypted = await decryptSym(encrypted, ivBuffer, secretKey)

	if (decrypted instanceof Error) {
		return new Error(`Failed to decrypt the provided content\n${decrypted.message}`)
	}

	return decrypted
}

export async function decryptTextSymFromTRPC(data: string, iv: string, secretKey: CryptoKey): Promise<string | Error> {
	const decrypted = await decryptSymFromTRPC(data, iv, secretKey)

	if (decrypted instanceof Error) {
		return decrypted
	}

	const text = bufferToText(decrypted)

	if (text instanceof Error) {
		return new Error('Failed to decode the decrypted data buffer to text')
	}

	return text
}

export async function decryptAsymFromTRPC(data: string, privateKey: CryptoKey): Promise<Uint8Array | Error> {
	const encrypted = deserializeBuffer(data)

	if (encrypted instanceof Error) {
		return new Error('Failed to deserialize the encrypted data buffer')
	}

	const decrypted = await decryptAsym(encrypted, privateKey)

	if (decrypted instanceof Error) {
		return new Error(`Failed to decrypt the provided content\n${decrypted.message}`)
	}

	return decrypted
}

export async function decryptTextAsymFromTRPC(data: string, privateKey: CryptoKey): Promise<string | Error> {
	const decrypted = await decryptAsymFromTRPC(data, privateKey)

	if (decrypted instanceof Error) {
		return decrypted
	}

	const text = bufferToText(decrypted)

	if (text instanceof Error) {
		return new Error('Failed to decode the decrypted data buffer to text')
	}

	return text
}

export async function importKeyFromTRPC(
	jwk: string,
	type: 'sym' | 'asymPub' | 'asymPriv',
	exportable?: boolean,
): Promise<CryptoKey | Error> {
	const existing = importedKeys.get(jwk)

	if (existing) {
		return existing
	}

	const parsed = parseJWK(jwk)

	if (parsed instanceof Error) {
		return new Error('Failed to parse the provided JsonWebKey')
	}

	const imported = await importKey(parsed, type, exportable)

	if (imported instanceof Error) {
		return new Error('Failed to import the provided JsonWebKey')
	}

	importedKeys.set(jwk, imported)

	return imported
}
