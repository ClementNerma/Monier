import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './api'
import { state } from './state'

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${window.location.origin}/trpc`,
			headers: () =>
				state.accessToken === null
					? {}
					: {
							authorization: `Bearer ${state.accessToken}`,
					  },
		}),
	],
})
