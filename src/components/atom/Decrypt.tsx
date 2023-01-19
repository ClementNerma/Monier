import { createSignal, onCleanup, onMount } from 'solid-js'
import { deserializeBuffer } from '../../common/base64'
import { decryptSym } from '../../common/crypto'
import { bufferToText, mapUnion } from '../../common/utils'
import { savedCredentials } from '../../state'

export type DecryptProps = {
	// Serialized buffer
	data: string
	iv: string
}

type DecryptionStatus =
	| 'componentLoading'
	| 'noMasterKey'
	| 'invalidDataBuffer'
	| 'invalidIvBuffer'
	| 'decryptionFailed'
	| 'textDecodingFailed'
	| 'success'

export const Decrypt = ({ data, iv }: DecryptProps) => {
	const [status, setStatus] = createSignal<[DecryptionStatus, string | null]>(['componentLoading', null])
	const [removeListener, setRemoveListener] = createSignal<{ remove(): void } | null>(null)

	onMount(() =>
		setRemoveListener({
			remove: savedCredentials.subscribe(async (credentials) => {
				if (credentials === null) {
					setStatus(['noMasterKey', null])
					return
				}

				const dataBuffer = deserializeBuffer(data)

				if (dataBuffer instanceof Error) {
					setStatus(['invalidDataBuffer', null])
					return
				}

				const ivBuffer = deserializeBuffer(iv)

				if (ivBuffer instanceof Error) {
					setStatus(['invalidIvBuffer', null])
					return
				}

				const { masterKey } = await credentials

				const decrypted = await decryptSym(dataBuffer, masterKey, ivBuffer)

				if (decrypted instanceof Error) {
					setStatus(['decryptionFailed', null])
					return
				}

				const decoded = bufferToText(decrypted)

				if (decoded instanceof Error) {
					setStatus(['textDecodingFailed', null])
					return
				}

				setStatus(['success', decoded])
			}),
		}),
	)

	onCleanup(() => removeListener()?.remove())

	return (
		<>
			{mapUnion(status()[0])({
				componentLoading: <em>Loading...</em>,
				noMasterKey: <em>Master key is missing!</em>,
				invalidDataBuffer: <em>Data buffer is invalid</em>,
				invalidIvBuffer: <em>IV buffer is invalid</em>,
				decryptionFailed: <em>Decryption failed</em>,
				textDecodingFailed: <em>Text decoding failed</em>,
				success: status()[1],
			})}
		</>
	)
}
