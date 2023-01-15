import { createSignal } from 'solid-js'
import { state } from '../../misc/state'
import { trpc } from '../../misc/trpc-client'

export const AuthStatus = () => {
	const [status, setStatus] = createSignal('-')

	state.subscribe(async (state) => {
		if (state.accessToken === null) {
			return setStatus('Not logged in')
		}

		setStatus('Loading...')

		const viewer = await trpc.auth.viewer.query()

		return setStatus(viewer ? 'Logged in!' : 'Invalid access token :(')
	})

	return <p>Authentication status: {status()}</p>
}
