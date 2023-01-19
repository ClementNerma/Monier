import { createSignal, Show } from 'solid-js'
import { deserializeBuffer, serializeBuffer } from '../../common/base64'
import {
	decryptSym,
	encryptAsym,
	encryptSymForTRPC,
	exportKey,
	generateSymmetricKey,
	importAsymPublicKey,
	parseJWK,
} from '../../common/crypto'
import { expectOk, fallible, textToBuffer } from '../../common/utils'
import { createApiClient } from '../../common/trpc-client'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'

export type CorrespondenceCodeInputProps = {
	displayNameMK: string
	displayNameMKIV: string
}

export const CorrespondenceCodeInput = ({ displayNameMK, displayNameMKIV }: CorrespondenceCodeInputProps) => {
	const [correspondenceCode, setCorrespondenceCode] = createSignal('')
	const [serverUrl, setServerUrl] = createSignal(location.origin)
	const [status, setStatus] = createSignal('')

	async function submit() {
		setStatus('Contacting distant server...')

		const distantUrl = serverUrl()

		const masterKey = await expectMasterKey()

		const displayName = expectOk(
			await decryptSym(
				expectOk(deserializeBuffer(displayNameMK)),
				masterKey,
				expectOk(deserializeBuffer(displayNameMKIV)),
			),
		)

		const distantApi = createApiClient(distantUrl)

		const { correspondenceInitID, correspondenceInitPublicKeyJWK } =
			await distantApi.correspondenceRequest.individuals.getPublicKey.query({
				correspondenceCode: correspondenceCode(),
			})

		setStatus('Generating a correspondence key...')

		const rawCorrespondencePublicKey = expectOk(
			parseJWK(correspondenceInitPublicKeyJWK),
			'Failed to parse correspondence public key',
		)

		const pubKey = expectOk(
			await fallible(() => importAsymPublicKey(rawCorrespondencePublicKey)),
			'Failed to import correspondence public key',
		)

		const correspondenceKeyJWK = textToBuffer(await exportKey(await generateSymmetricKey()))

		setStatus('Answering the correspondence request...')

		await trpc.correspondenceRequest.individuals.createAnswered.mutate({
			correspondenceInitID,
			correspondenceKeyMK: await encryptSymForTRPC(correspondenceKeyJWK, masterKey),
			correspondenceKeyCIPK: serializeBuffer(await encryptAsym(correspondenceKeyJWK, pubKey)),
			displayNameCK: await encryptSymForTRPC(displayName, masterKey),
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
