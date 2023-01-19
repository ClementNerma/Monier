import { createSignal } from 'solid-js'
import { serializeBuffer } from '../../common/base64'
import {
	deriveKeyFromPassword,
	encryptSymForTRPC,
	exportKey,
	generateRandomBuffer,
	generateSalt,
	generateSymmetricKey,
	hash,
} from '../../common/crypto'
import { expectOk, textToBuffer } from '../../common/utils'
import { trpc } from '../../trpc-client'

export const RegisterForm = () => {
	const [username, setUsername] = createSignal('')
	const [displayName, setDisplayName] = createSignal('')
	const [password, setPassword] = createSignal('')

	async function register() {
		const usernameHash = await hash(expectOk(textToBuffer(username())))

		const passwordSalt = generateSalt()
		const passwordKey = await deriveKeyFromPassword(expectOk(textToBuffer(password())), passwordSalt)

		const passwordProofPlainText = generateRandomBuffer(32)

		const masterKey = await generateSymmetricKey()

		await trpc.users.register.mutate({
			usernameHash,
			passwordSalt: serializeBuffer(passwordSalt),
			passwordProofPlainText: serializeBuffer(passwordProofPlainText),
			passwordProofPK: await encryptSymForTRPC(passwordProofPlainText, passwordKey),
			masterKeyPK: await encryptSymForTRPC(expectOk(textToBuffer(await exportKey(masterKey))), passwordKey),
			displayNameMK: await encryptSymForTRPC(expectOk(textToBuffer(displayName())), masterKey),
		})

		location.pathname = '/login'
	}

	return (
		<form>
			<input
				type="text"
				placeholder="Username"
				autocomplete='username'
				required
				onChange={(e) => setUsername(e.currentTarget.value)}
			/>

			<input
				type="text"
				placeholder="Display name"
				autocomplete='name'
				required
				onChange={(e) => setDisplayName(e.currentTarget.value)}
			/>

			<input
				type="password"
				placeholder="Password"
				autocomplete='new-password'
				required
				onChange={(e) => setPassword(e.currentTarget.value)}
			/>

			<input type="submit" value="Submit" onClick={register} />
		</form>
	)
}
