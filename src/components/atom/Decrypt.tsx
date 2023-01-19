import { createSignal, onMount, Show } from 'solid-js'
import { deserializeBuffer } from '../../common/base64'
import { decryptSym, importKey, parseJWK } from '../../common/crypto'
import { bufferToText } from '../../common/utils'
import { importedMKKeys, savedCredentials } from '../../state'
import { ErrorMessage } from './ErrorMessage'

export type DecryptProps = {
	data: string
	iv: string
	decrypt: DecryptPropsKey
}

export type DecryptPropsKey =
	// The data is encrypted with the Master Key
	| { with: 'masterKey' }
	// Provided CryptoKey
	| { with: 'direct'; key: CryptoKey }
	// Plain text JWK key
	| { with: 'plainKey'; content: string }
	// JWK symmetryc key encrypted with the Master Key
	| { with: 'symMK'; content: string; iv: string }

export const Decrypt = (props: DecryptProps) => {
	const [error, setError] = createSignal('')
	const [result, setResult] = createSignal('')

	onMount(async () => {
		const result = await tryTextDecryption(props)

		if (result instanceof Error) {
			setError(result.message)
		} else {
			setResult(result)
		}
	})

	return (
		<>
			<Show when={error()}>
				<ErrorMessage message={error()} inline />
			</Show>
			<Show when={result()}>
				<span>{result}</span>
			</Show>
		</>
	)
}

async function getKey(key: DecryptPropsKey): Promise<CryptoKey | Error> {
	if (key.with === 'direct') {
		return key.key
	}

	if (key.with === 'plainKey' || key.with === 'symMK') {
		const existing = importedMKKeys.get(key.content)

		if (existing) {
			return existing
		}
	}

	if (key.with === 'masterKey' || key.with === 'symMK') {
		const credentials = await savedCredentials.get()

		if (!credentials) {
			return new Error('No credentials saved')
		}

		if (key.with === 'masterKey') {
			return credentials.masterKey
		}

		const encryptedKey = deserializeBuffer(key.content)

		if (encryptedKey instanceof Error) {
			return new Error('Failed to deserialize the encrypted key buffer')
		}

		const iv = deserializeBuffer(key.iv)

		if (iv instanceof Error) {
			return new Error('Failed to deserialize the encrypted key IV')
		}

		const decryptedKey = await decryptSym(encryptedKey, iv, credentials.masterKey)

		if (decryptedKey instanceof Error) {
			return new Error('Failed to decrypt the second layer encryption key')
		}

		const decryptedKeyJWK = bufferToText(decryptedKey)

		if (decryptedKeyJWK instanceof Error) {
			return new Error('Failed to decode the second layer encryption key')
		}

		key = { with: 'plainKey', content: decryptedKeyJWK }
	}

	const parsed = parseJWK(key.content)

	if (parsed instanceof Error) {
		return new Error('Failed to parse the provided key')
	}

	const imported = await importKey(parsed, 'sym')

	if (imported instanceof Error) {
		return new Error('Failed to import the provided key')
	}

	return imported
}

export async function tryTextDecryption({ data, decrypt, iv }: DecryptProps): Promise<string | Error> {
	const finalKey = await getKey(decrypt)

	if (finalKey instanceof Error) {
		return finalKey
	}

	const encrypted = deserializeBuffer(data)

	if (encrypted instanceof Error) {
		return new Error('Failed to deserialize the data buffer')
	}

	const ivBuffer = deserializeBuffer(iv)

	if (ivBuffer instanceof Error) {
		return new Error('Failed to deserialize the IV buffer')
	}

	const decrypted = await decryptSym(encrypted, ivBuffer, finalKey)

	if (decrypted instanceof Error) {
		return new Error(`Failed to decrypt the provided content${decrypted.message}`)
	}

	const plainText = bufferToText(decrypted)

	if (plainText instanceof Error) {
		return new Error('Failed to decode the decrypted content as text')
	}

	return plainText
}
