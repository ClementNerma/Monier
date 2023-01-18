import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from './server'

export function createApiClient(url: string) {
	return createTRPCProxyClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${url}/trpc`,
			}),
		],
	})
}

export const trpc = createApiClient(window.location.origin)
