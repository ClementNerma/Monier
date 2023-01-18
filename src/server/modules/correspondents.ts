import type { Correspondent } from '@prisma/client'
import { createRouter } from '../router'
import { authProcedure } from './auth'

export default createRouter({
	list: authProcedure.query<Correspondent[]>(({ ctx }) =>
		ctx.db.correspondent.findMany({
			where: { forUserId: ctx.viewer.id },
		}),
	),
})
