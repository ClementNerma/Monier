import { createSignal } from 'solid-js'
import { globalAccessToken } from '../../state'
import { trpc } from '../../trpc-client'

export const AuthStatus = () => {
	const [status, setStatus] = createSignal('-')

	globalAccessToken.subscribe(async (accessToken) => {
		if (accessToken === null) {
			return setStatus('Not logged in')
		}

		setStatus('Loading...')

		const viewer = await trpc.auth.viewer.query()

		return setStatus(viewer ? 'Logged in!' : 'Invalid access token :(')
	})

	return <p>Authentication status: {status()}</p>
}
