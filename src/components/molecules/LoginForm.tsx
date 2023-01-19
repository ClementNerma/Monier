import { createSignal } from 'solid-js'
import { deserializeBuffer, serializeBuffer } from '../../common/base64'
import { decryptSym, deriveKeyFromPassword, encryptSym, hash, importSymKey, parseJWK } from '../../common/crypto'
import { bufferToText, textToBuffer, expectOk, fallible } from '../../common/utils'
import { globalAccessToken, globalMasterKey } from '../../state'
import { trpc } from '../../trpc-client'

export const LoginForm = () => {
	const [username, setUsername] = createSignal('')
	const [password, setPassword] = createSignal('')

	async function login() {
		const usernameHash = await hash(expectOk(textToBuffer(username())))

		const { passwordProofPlainText, passwordProofPKIV, passwordSalt } = await trpc.users.getLoginInformations.query({
			usernameHash,
		})

		const passwordKey = await deriveKeyFromPassword(
			expectOk(textToBuffer(password())),
			expectOk(deserializeBuffer(passwordSalt)),
		)
		const passwordProofPK = await encryptSym(
			expectOk(deserializeBuffer(passwordProofPlainText)),
			passwordKey,
			expectOk(deserializeBuffer(passwordProofPKIV)),
		)

		const {
			accessToken,
			user: { masterKeyPK, masterKeyPKIV },
		} = await trpc.users.login.mutate({
			usernameHash,
			passwordProofPK: serializeBuffer(passwordProofPK),
		})

		const decryptedMasterKey = await decryptSym(
			expectOk(deserializeBuffer(masterKeyPK)),
			passwordKey,
			expectOk(deserializeBuffer(masterKeyPKIV)),
		)

		const masterKeyJWK = expectOk(bufferToText(expectOk(decryptedMasterKey)))
		const rawMasterKey = expectOk(parseJWK(masterKeyJWK))

		const masterKey = expectOk(await fallible(() => importSymKey(rawMasterKey, true)), 'Failed to import master key')

		globalAccessToken.set(accessToken)
		globalMasterKey.set(Promise.resolve(masterKey))

		// location.pathname = '/'
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<input
				type="text"
				placeholder="Username"
				autocomplete='usernmae'
				required
				onChange={(e) => setUsername(e.currentTarget.value)}
			/>

			<input
				type="password"
				placeholder="Password"
				autocomplete='current-password'
				required
				onChange={(e) => setPassword(e.currentTarget.value)}
			/>

			<input type="submit" value="Submit" onClick={login} />
		</form>
	)
}
