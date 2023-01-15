import { createSignal } from 'solid-js'
import { state } from '../../misc/state'
import { trpc } from '../../misc/trpc-client'

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
			state.set({
				accessToken: res.data,
			})

			setResult('Success!')
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
