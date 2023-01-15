import { createSignal } from 'solid-js'
import { trpc } from '../../trpc-client'

export const LoginForm = () => {
	const [email, setEmail] = createSignal('')
	const [password, setPassword] = createSignal('')

	const [result, setResult] = createSignal<string | null>(null)

	async function login() {
		setResult('Loading...')

		const res = await trpc.users.login.mutate({
			email: email(),
			password: password(),
		})

		if (!res.ok) {
			setResult(`Error: ${res.reason}`)
		} else {
			const viewer = await trpc.auth.viewer.query()

			if (!viewer) {
				setResult('Not logged in :(')
			} else {
				setResult('Successfully logged in :D')
			}
		}
	}

	return (
		<div>
			<p>{result()}</p>

			<input type="email" placeholder="E-mail" required onChange={(e) => setEmail(e.currentTarget.value)} />
			<input type="password" placeholder="Password" required onChange={(e) => setPassword(e.currentTarget.value)} />

			<input type="submit" value="Submit" onClick={login} />
		</div>
	)
}
