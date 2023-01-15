import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { getContext } from './context'
import { createRouter } from './router'

import auth from './modules/auth'
import users from './modules/users'

export const appRouter = createRouter({
	auth,
	users,
})

export type AppRouter = typeof appRouter

export const requestHandler = (req: Request) =>
	fetchRequestHandler({
		router: appRouter,
		endpoint: '/trpc',
		req,
		createContext: getContext,
	})
