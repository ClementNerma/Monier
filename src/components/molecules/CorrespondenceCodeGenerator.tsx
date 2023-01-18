import { createSignal } from 'solid-js'
import { encryptSymForTRPC, exportKey, generateAsymmetricKeyPair } from '../../common/crypto'
import { textToBuffer } from '../../common/utils'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'

export const CorrespondenceCodeGenerator = () => {
	const [result, setResult] = createSignal<string>('')

	async function generate() {
		setResult('Loading...')

		const { publicKey, privateKey } = await generateAsymmetricKeyPair()

		const { correspondenceCode } = await trpc.correspondenceRequest.individuals.generateCode.mutate({
			correspondenceInitPublicKey: await exportKey(publicKey),
			correspondenceInitPrivateKeyMK: await encryptSymForTRPC(
				textToBuffer(await exportKey(privateKey)),
				await expectMasterKey(),
			),
		})

		setResult(correspondenceCode)
	}

	return (
		<>
			<button onClick={generate}>Generate a correspondence code</button>
			<br />
			{result()}
		</>
	)
}
