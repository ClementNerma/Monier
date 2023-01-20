import type { AstroGlobal } from 'astro'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext, createServerContext } from './context'
import { createRouter } from './router'

import auth from './modules/auth'
import users from './modules/users'
import correspondenceRequest from './modules/correspondence-request'
import correspondents from './modules/correspondents'
import exchanges from './modules/exchanges'
import server from './modules/server'

import { CONFIG } from './config'

const serverUrl = new URL(CONFIG.CURRENT_SERVER_URL)

if (serverUrl.protocol !== 'https') {
	console.warn('WARNING: the server\'s protocol should ALWAYS be "https"!')
}

export const appRouter = createRouter({
	auth,
	users,
	correspondenceRequest,
	correspondents,
	exchanges,

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
