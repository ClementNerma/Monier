import { createSignal, Show } from 'solid-js'
import { deserializeBuffer, serializeBuffer } from '../../common/base64'
import { decryptSym, deriveKeyFromPassword, encryptSym, hash, importKey, parseJWK } from '../../common/crypto'
import { bufferToText, textToBuffer, expectOk, fallible } from '../../common/utils'
import { savedCredentials } from '../../state'
import { trpc } from '../../trpc-client'
import { ErrorMessage } from '../atom/ErrorMessage'

export const LoginForm = () => {
	const [username, setUsername] = createSignal('')
	const [password, setPassword] = createSignal('')
	const [error, setError] = createSignal('')

	async function login() {
		setError('')

		const usernameHash = await hash(expectOk(textToBuffer(username())))

		const loginInfos = await fallible(() =>
			trpc.users.getLoginInformations.query({
				usernameHash,
			}),
		)

		if (loginInfos instanceof Error) {
			setError(loginInfos.message)
			return
		}

		const { passwordProofPlainText, passwordProofPKIV, passwordSalt } = loginInfos

		const passwordKey = await deriveKeyFromPassword(
			expectOk(textToBuffer(password())),
			expectOk(deserializeBuffer(passwordSalt)),
		)

		const passwordProofPK = await encryptSym(
			expectOk(deserializeBuffer(passwordProofPlainText)),
			passwordKey,
			expectOk(deserializeBuffer(passwordProofPKIV)),
		)

		const res = await fallible(() =>
			trpc.users.login.mutate({
				usernameHash,
				passwordProofPK: serializeBuffer(passwordProofPK),
			}),
		)

		if (res instanceof Error) {
			setError(res.message)
			return
		}

		const {
			accessToken,
			user: { masterKeyPK, masterKeyPKIV },
		} = res

		const decryptedMasterKey = await decryptSym(
			expectOk(deserializeBuffer(masterKeyPK)),
			expectOk(deserializeBuffer(masterKeyPKIV)),
			passwordKey,
		)

		const masterKeyJWK = expectOk(bufferToText(expectOk(decryptedMasterKey)))
		const rawMasterKey = expectOk(parseJWK(masterKeyJWK))

		const masterKey = expectOk(
			await fallible(() => importKey(rawMasterKey, 'sym', true)),
			'Failed to import master key',
		)

		const saved = await savedCredentials.setAndWait(Promise.resolve({ accessToken, masterKey }))

		if (!saved) {
			setError('An error occurred while saving the credentials locally')
		} else {
			location.pathname = '/'
		}
	}

	return (
		<form onSubmit={(e) => e.preventDefault()}>
			<Show when={error()}>
				<ErrorMessage message={error()} />
			</Show>

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
