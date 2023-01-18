import { TRPCError } from '@trpc/server'
import { createMiddleware, createRouter } from '../router'
import { publicProcedure } from './auth'

const serverMiddleware = createMiddleware(({ ctx, next }) => {
	const serverCtx = ctx.server

	if (!serverCtx) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'This procedure is reserved to the server itself' })
	}

	return next({
		ctx: {
			...ctx,
			server: serverCtx,
		},
	})
})

const serverProcedure = publicProcedure.use(serverMiddleware)

export default createRouter({
	viewer: serverProcedure.query(({ ctx }) => ctx.server.resolvedSession?.user),
})
