import { createSignal } from 'solid-js'
import { trpc } from '../../misc/trpc-client'

export const RegisterForm = () => {
	const [email, setEmail] = createSignal('')
	const [password, setPassword] = createSignal('')

	const [result, setResult] = createSignal(<></>)

	async function register() {
		setResult('Loading...')

		const res = await trpc.users.register.mutate({
			email: email(),
			password: password(),
		})

		if (!res.ok) {
			setResult(`Error: ${res.reason}`)
		} else {
			setResult(
				<>
					Successfully registered!
					<br />
					You may now go to the <a href="/login">login page</a>.
				</>,
			)
		}
	}

	return (
		<div>
			<p>{result()}</p>

			<input type="email" placeholder="E-mail" required onChange={(e) => setEmail(e.currentTarget.value)} />
			<input type="password" placeholder="Password" required onChange={(e) => setPassword(e.currentTarget.value)} />
			<input type="submit" value="Submit" onClick={register} />
		</div>
	)
}
