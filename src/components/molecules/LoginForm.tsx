import { createSignal } from 'solid-js'
import {
	decryptSym,
	deriveKeyFromPassword,
	deserializeBuffer,
	encryptSym,
	hash,
	serializeBuffer,
} from '../../common/crypto'
import { globalAccessToken, globalMasterKey } from '../../state'
import { trpc } from '../../trpc-client'

export const LoginForm = () => {
	const [username, setUsername] = createSignal('')
	const [password, setPassword] = createSignal('')

	async function login() {
		const usernameHash = await hash(username())

		const { passwordProofPlainText, passwordProofPKIV, passwordSalt } = await trpc.users.getLoginInformations.query({
			usernameHash,
		})

		const passwordKey = await deriveKeyFromPassword(password(), deserializeBuffer(passwordSalt))
		const passwordProofPK = await encryptSym(
			deserializeBuffer(passwordProofPlainText),
			passwordKey,
			deserializeBuffer(passwordProofPKIV),
		)

		const {
			accessToken,
			user: { masterKeyPK, masterKeyPKIV },
		} = await trpc.users.login.mutate({
			usernameHash,
			passwordProofPK: serializeBuffer(passwordProofPK),
		})

		const masterKey = await decryptSym(deserializeBuffer(masterKeyPK), passwordKey, deserializeBuffer(masterKeyPKIV))

		globalAccessToken.set(accessToken)
		globalMasterKey.set(masterKey)
	}

	return (
		<div>
			<input type="text" placeholder="Username" required onChange={(e) => setUsername(e.currentTarget.value)} />
			<input type="password" placeholder="Password" required onChange={(e) => setPassword(e.currentTarget.value)} />

			<input type="submit" value="Submit" onClick={login} />
		</div>
	)
}
