import type { AstroGlobal } from 'astro'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext, createServerContext } from './context'
import { createRouter } from './router'

import auth from './modules/auth'
import users from './modules/users'
import correspondenceRequest from './modules/correspondence-request'

export const appRouter = createRouter({
	auth,
	users,
	correspondenceRequest,
})

export type AppRouter = typeof appRouter

export const serverApp = async (astro: AstroGlobal) => appRouter.createCaller(await createServerContext(astro))

export const requestHandler = (req: Request) =>
	fetchRequestHandler({
		router: appRouter,
		endpoint: '/trpc',
		req,
		createContext,
	})
