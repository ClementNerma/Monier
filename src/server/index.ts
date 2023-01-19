import type { AstroGlobal } from 'astro'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext, createServerContext } from './context'
import { createRouter } from './router'

import auth from './modules/auth'
import users from './modules/users'
import correspondenceRequest from './modules/correspondence-request'
import correspondents from './modules/correspondents'
import server from './modules/server'
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'

export const appRouter = createRouter({
	auth,
	users,
	correspondenceRequest,
	correspondents,
	server,
})

export type AppRouter = typeof appRouter

export const serverApp = async (astro: AstroGlobal) => appRouter.createCaller(await createServerContext(astro))

export type ServerApp = Awaited<ReturnType<typeof serverApp>>

export const requestHandler = (req: Request) =>
	fetchRequestHandler({
		router: appRouter,
		endpoint: '/trpc',
		req,
		createContext,
	})

export function createApiClient(url: string) {
	return createTRPCProxyClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${url}/trpc`,
			}),
		],
	})
}
