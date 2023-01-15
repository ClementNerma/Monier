import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server'
import { accessToken } from './state'

export const trpc = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${window.location.origin}/trpc`,
			headers: () => {
				const token = accessToken.get()

				if (token === null) {
					return {}
				}

				return {
					authorization: `Bearer ${token}`,
				}
			},
		}),
	],
})
