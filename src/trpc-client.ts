import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './api'
import { state } from './state'

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${window.location.origin}/trpc`,
			headers: () => {
				const accessToken = state.get().accessToken

				if (accessToken === null) {
					return {}
				}

				return {
					authorization: `Bearer ${accessToken}`,
				}
			},
		}),
	],
})
