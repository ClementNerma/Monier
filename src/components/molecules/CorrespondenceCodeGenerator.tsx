import { createSignal } from 'solid-js'
import { exportKey, generateAsymmetricKeyPair } from '../../common/crypto'
import { encryptTextSymForTRPC } from '../../common/crypto-trpc'
import { expectMasterKey } from '../../state'
import { trpc } from '../../trpc-client'

export const CorrespondenceCodeGenerator = () => {
	const [result, setResult] = createSignal<string>('')

	async function generate() {
		setResult('Loading...')

		const { publicKey, privateKey } = await generateAsymmetricKeyPair()

		const { correspondenceCode } = await trpc.correspondenceRequest.individuals.generateCode.mutate({
			correspondenceInitPublicKeyJWK: await exportKey(publicKey),
			correspondenceInitPrivateKeyMK: await encryptTextSymForTRPC(await exportKey(privateKey), await expectMasterKey()),
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
