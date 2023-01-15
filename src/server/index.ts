import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext, createServerContext } from './context'
import { createRouter } from './router'

import auth from './modules/auth'
import users from './modules/users'
import type { AstroGlobal } from 'astro'

export const appRouter = createRouter({
	auth,
	users,
})

export type AppRouter = typeof appRouter

export const serverApp = (astro: AstroGlobal) => appRouter.createCaller(createServerContext(astro.cookies))

export const requestHandler = (req: Request) =>
	fetchRequestHandler({
		router: appRouter,
		endpoint: '/trpc',
		req,
		createContext,
	})
