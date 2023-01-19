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

// const serverAuthProcedure = serverProcedure.use(({ ctx, next }) => {
// 	if (!ctx.server.resolvedSession) {
// 		throw new Error('Internal error: this procedure is reserved to authenticated users')
// 	}

// 	return next({
// 		ctx: {
// 			...ctx,
// 			server: {
// 				...ctx.server,
// 				resolvedSession: ctx.server.resolvedSession,
// 			},
// 		},
// 	})
// })

export default createRouter({
	viewer: serverProcedure.query(({ ctx }) => ctx.server.resolvedSession?.user),
})
