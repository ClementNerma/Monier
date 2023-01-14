import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../pages/trpc/[route]'

export const client = createTRPCProxyClient<AppRouter>({
	links: [
		httpBatchLink({
			url: `${window.location.origin}/trpc`,
		}),
	],
})
