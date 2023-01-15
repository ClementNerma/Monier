import type { Session, User } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { COOKIE_NAMES } from '../../common/constants'
import { getCookie } from '../../common/cookies'
import { map, pick } from '../../common/utils'
import { baseProcedure, createMiddleware, createRouter } from '../router'

export const maybeAuthMiddleware = createMiddleware(async ({ ctx, next }) => {
	const nextWithViewer = (session: (Session & { user: User }) | null) =>
		next({
			ctx: {
				...ctx,
				session,
				viewer: session !== null ? session.user : null,
			},
		})

	const authToken = map(ctx.cookies, (cookies) =>
		typeof cookies === 'string'
			? getCookie(cookies, COOKIE_NAMES.accessToken)
			: cookies.get(COOKIE_NAMES.accessToken)?.value ?? null,
	)

	if (authToken === null) {
		return nextWithViewer(null)
	}

	const session = await ctx.db.session.findUnique({
		include: {
			user: true,
		},
		where: {
			id: authToken,
		},
	})

	if (!session) {
		return nextWithViewer(null)
	}

	// TODO: invalidate sessions after expiration date

	return nextWithViewer(session)
})

export const publicProcedure = baseProcedure
export const maybeAuthProcedure = publicProcedure.use(maybeAuthMiddleware)
export const authProcedure = maybeAuthProcedure.use(async ({ ctx, next }) => {
	if (ctx.session === null) {
		throw new TRPCError({ code: 'UNAUTHORIZED', message: '' })
	}

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			viewer: ctx.session.user,
		},
	})
})

export default createRouter({
	viewer: maybeAuthProcedure.query(({ ctx }) => map(ctx.viewer, (viewer) => pick(viewer, ['id', 'email']))),
})
