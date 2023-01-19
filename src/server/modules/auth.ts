import type { Session, User } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { AstroCookies } from 'astro/dist/core/cookies'
import { CONSTANTS } from '../../common/constants'
import { getCookie } from '../../common/cookies'
import { map, pick } from '../../common/utils'
import { CONFIG } from '../config'
import type { Context } from '../context'
import { baseProcedure, createMiddleware, createRouter } from '../router'

export async function getSession(
	cookies: Context['cookies'] | AstroCookies,
	db: Context['db'],
): Promise<(Session & { user: User }) | null> {
	const accessToken = map(cookies, (cookies) =>
		typeof cookies === 'string'
			? getCookie(cookies, CONSTANTS.cookieNames.accessToken)
			: cookies.get(CONSTANTS.cookieNames.accessToken)?.value ?? null,
	)

	if (accessToken === null) {
		return null
	}

	const session = await db.session.findUnique({
		include: { user: true },
		where: { accessToken },
	})

	if (!session) {
		return null
	}

	// Cancel sessions after they expire
	if (Date.now() > session.createdAt.getTime() + CONFIG.SESSION_EXPIRES_AFTER_HOURS * 3600) {
		await db.session.delete({ where: { id: session.id } })

		return null
	}

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
