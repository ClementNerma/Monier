import { createSignal, onMount, Show } from 'solid-js'
import { decryptTextSymFromTRPC, importKeyFromTRPC } from '../../common/crypto-trpc'
import { expectMasterKey, importedMKKeys } from '../../state'
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
	| { with: 'jwk'; content: string }
	// JWK symmetryc key encrypted with the Master Key
	| { with: 'jwkMK'; content: string; iv: string }

export const Decrypt = ({ data, iv, decrypt }: DecryptProps) => {
	const [error, setError] = createSignal('')
	const [result, setResult] = createSignal('')

	onMount(async () => {
		const key = await getKey(decrypt)

		if (key instanceof Error) {
			setError(key.message)
			return
		}

		const result = await decryptTextSymFromTRPC(data, iv, key)

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

	if (key.with === 'jwk' || key.with === 'jwkMK') {
		const existing = importedMKKeys.get(key.content)

		if (existing) {
			return existing
		}
	}

	if (key.with === 'masterKey' || key.with === 'jwkMK') {
		const masterKey = await expectMasterKey()

		if (key.with === 'masterKey') {
			return masterKey
		}

		const keyJWK = await decryptTextSymFromTRPC(key.content, key.iv, masterKey)

		if (keyJWK instanceof Error) {
			return new Error('Failed to decode the second layer encryption key')
		}

		key = { with: 'jwk', content: keyJWK }
	}

	const imported = await importKeyFromTRPC(key.content, 'sym')

	if (imported instanceof Error) {
		return new Error('Failed to import the provided key')
	}

	return imported
}
