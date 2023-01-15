import type { WritableAtom } from 'nanostores'
import { trpc } from './trpc-client'

function redirectToLoginPage() {
	if (!['/login', '/register'].includes(location.pathname)) {
		location.pathname = '/login'
	}
}

export function setupLoginRedirect(accessToken: WritableAtom<string | null>) {
	accessToken.subscribe(async (accessToken) => {
		if (accessToken === null) {
			return redirectToLoginPage()
		}

		const viewer = trpc.auth.viewer.query()

		if (viewer === null) {
			return redirectToLoginPage()
		}
	})
}
