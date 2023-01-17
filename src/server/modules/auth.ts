import type { Session, User } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { AstroCookies } from 'astro/dist/core/cookies'
import { COOKIE_NAMES } from '../../common/constants'
import { getCookie } from '../../common/cookies'
import { map, pick } from '../../common/utils'
import type { Context } from '../context'
import { baseProcedure, createMiddleware, createRouter } from '../router'

export async function getSession(
	cookies: Context['cookies'] | AstroCookies,
	db: Context['db'],
): Promise<(Session & { user: User }) | null> {
	const authToken = map(cookies, (cookies) =>
		typeof cookies === 'string'
			? getCookie(cookies, COOKIE_NAMES.accessToken)
			: cookies.get(COOKIE_NAMES.accessToken)?.value ?? null,
	)

	if (authToken === null) {
		return null
	}

	const session = await db.session.findUnique({
		include: {
			user: true,
		},
		where: {
			id: authToken,
		},
	})

	if (!session) {
		return null
	}

	// TODO: invalidate sessions after expiration date

	return session
}

export const maybeAuthMiddleware = createMiddleware(async ({ ctx, next }) => {
	const session = ctx.server?.resolvedSession ?? (await getSession(ctx.cookies, ctx.db))

	return next({
		ctx: {
			...ctx,
			session,
			viewer: session !== null ? session.user : null,
		},
	})
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
	viewer: maybeAuthProcedure.query(({ ctx }) => map(ctx.viewer, (viewer) => pick(viewer, ['id', 'masterKeyPK']))),
})
