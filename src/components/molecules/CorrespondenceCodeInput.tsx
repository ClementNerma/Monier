import { createSignal, Show } from 'solid-js'
import { serializeBuffer } from '../../common/base64'
import { encryptAsym, exportKey, generateSymmetricKey } from '../../common/crypto'
import { expectOk, textToBuffer } from '../../common/utils'
import { createApiClient } from '../../common/trpc-client'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'
import {
	decryptTextSymFromTRPC,
	encryptSymForTRPC,
	encryptTextSymForTRPC,
	importKeyFromTRPC,
} from '../../common/crypto-trpc'

export type CorrespondenceCodeInputProps = {
	displayNameMK: string
	displayNameMKIV: string
}

export const CorrespondenceCodeInput = ({ displayNameMK, displayNameMKIV }: CorrespondenceCodeInputProps) => {
	const [correspondenceCode, setCorrespondenceCode] = createSignal('')
	const [serverUrl, setServerUrl] = createSignal(location.origin)
	const [status, setStatus] = createSignal('')

	async function submit() {
		setStatus('Decrypting local personal informations...')

		const masterKey = await expectMasterKey()

		const displayName = expectOk(await decryptTextSymFromTRPC(displayNameMK, displayNameMKIV, masterKey))

		setStatus('Contacting distant server...')

		const distantUrl = serverUrl()
		const distantApi = createApiClient(distantUrl)

		const { correspondenceInitID, correspondenceInitPublicKeyJWK } =
			await distantApi.correspondenceRequest.individuals.getPublicKey.query({
				correspondenceCode: correspondenceCode(),
			})

		const correspondenceInitPublicKey = expectOk(await importKeyFromTRPC(correspondenceInitPublicKeyJWK, 'asymPub'))

		setStatus('Generating a correspondence key...')

		const correspondenceKey = await generateSymmetricKey()
		const correspondenceKeyJWK = textToBuffer(await exportKey(correspondenceKey))

		setStatus('Answering the correspondence request...')

		await trpc.correspondenceRequest.individuals.createAnswered.mutate({
			correspondenceInitID,
			correspondenceKeyMK: await encryptSymForTRPC(correspondenceKeyJWK, masterKey),
			correspondenceKeyCIPK: serializeBuffer(await encryptAsym(correspondenceKeyJWK, correspondenceInitPublicKey)),
			displayNameCK: await encryptTextSymForTRPC(displayName, correspondenceKey),
			serverUrl: distantUrl,
		})

		setCorrespondenceCode('')
		setServerUrl('')
		setStatus('Success!')
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<Show when={status()}>
				<p>{status()}</p>
			</Show>

			<label>Correspondence code :</label>{' '}
			<input
				type="text"
				autocomplete='off'
				required
				value={correspondenceCode()}
				onInput={(e) => setCorrespondenceCode(e.currentTarget.value)}
			/>

			<br />

			<label>Server URL:</label>{' '}
			<input
				type="url"
				autocomplete='url'
				required
				value={serverUrl()}
				onInput={(e) => setServerUrl(e.currentTarget.value)}
			/>

			<br />

			<input type="submit" onClick={submit} value="Submit" />
		</form>
	)
}
