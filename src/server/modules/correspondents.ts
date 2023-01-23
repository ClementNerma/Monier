import type { Correspondent, User } from '@prisma/client'
import { createRouter } from '../router'
import { authProcedure } from './auth'
import type { Context } from '../context'
import { TRPCError } from '@trpc/server'

export default createRouter({
	list: authProcedure.query<Correspondent[]>(({ ctx }) =>
		ctx.db.correspondent.findMany({
			where: { forUserId: ctx.viewer.id },
		}),
	),
})

export async function correspondentAuth(db: Context['db'], accessToken: string): Promise<Correspondent> {
	const correspondent = await db.correspondent.findUnique({
		where: { incomingAccessToken: accessToken },
	})

	if (!correspondent) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid access token provided' })
	}

	return correspondent
}

export async function getCorrespondent(
	db: Context['db'],
	correspondentId: string,
	viewer: User,
): Promise<Correspondent> {
	const correspondent = await db.correspondent.findUnique({
		where: { id: correspondentId },
	})

	if (!correspondent) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided correspondent was not found' })
	}

	if (correspondent.forUserId !== viewer.id) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'Provided correspondent belongs to another user' })
	}

	return correspondent
}
