import type { Correspondent } from '@prisma/client'
import { createRouter } from '../router'
import { authProcedure } from './auth'
import type { Context } from '../context'
import { TRPCError } from '@trpc/server'

export async function correspondentAuth(db: Context['db'], accessToken: string): Promise<Correspondent> {
	const correspondent = await db.correspondent.findUnique({
		where: { incomingAccessToken: accessToken },
	})

	if (!correspondent) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid access token provided' })
	}

	return correspondent
}

export default createRouter({
	list: authProcedure.query<Correspondent[]>(({ ctx }) =>
		ctx.db.correspondent.findMany({
			where: { forUserId: ctx.viewer.id },
		}),
	),
})
