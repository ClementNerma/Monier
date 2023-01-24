import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
	transformer: superjson,
})

export const createRouter = t.router
export const createMiddleware = t.middleware
export const baseProcedure = t.procedure
