import { createSignal, onCleanup, onMount } from 'solid-js'
import { deserializeBuffer } from '../../common/base64'
import { decryptSym } from '../../common/crypto'
import { globalMasterKey } from '../../state'

export type DecryptProps = {
	// Serialized buffer
	data: string
	iv: string
}

export const Decrypt = ({ data, iv }: DecryptProps) => {
	const [decrypted, setDecrypted] = createSignal<string | null | false>(null)
	const [removeListener, setRemoveListener] = createSignal<{ remove(): void } | null>(null)

	onMount(() =>
		setRemoveListener({
			remove: globalMasterKey.subscribe(async (masterKey) => {
				if (masterKey === null) {
					setDecrypted(false)
					return
				}

				const decrypted = await decryptSym(deserializeBuffer(data), await masterKey, deserializeBuffer(iv))

				const decoder = new TextDecoder()
				setDecrypted(decoder.decode(decrypted))
			}),
		}),
	)

	onCleanup(() => removeListener()?.remove())

	return <>{decrypted() === false ? '<unable to decrypt>' : decrypted() === null ? '<loading>' : decrypted()}</>
}
