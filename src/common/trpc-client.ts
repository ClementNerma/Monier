import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '../server'
import superjson from 'superjson'

export function createApiClient(url: string) {
	return createTRPCProxyClient<AppRouter>({
		transformer: superjson,
		links: [
			httpBatchLink({
				url: `${url}/trpc`,
			}),
		],
	})
}
