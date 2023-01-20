import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { generateRandomUUID } from '../../common/crypto'
import { map } from '../../common/utils'
import { createRouter } from '../router'
import { zSymEncrypted } from '../types'
import { publicProcedure } from './auth'

export default createRouter({
	// From sender (server) to recipient (server)
	createMessage: publicProcedure
		.input(
			z.object({
				accessToken: z.string(),
				isImportant: z.boolean(),
				exchangeId: z.string().nullable(),
				titleCK: zSymEncrypted,
				categoryCK: zSymEncrypted,
				bodyCK: zSymEncrypted,
				// TODO: files
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const correspondent = await ctx.db.correspondent.findUnique({
				where: { incomingAccessToken: input.accessToken },
			})

			if (!correspondent) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'The provided accessToken was not found' })
			}

			const exchangePromise =
				map(input.exchangeId, async (exchangeId) => {
					const exchange = await ctx.db.exchange.findUnique({
						where: { exchangeId },
					})

					if (!exchange) {
						throw new TRPCError({ code: 'NOT_FOUND', message: 'The provided exchange ID was not found' })
					}

					if (exchange.userId !== correspondent.forUserId) {
						throw new TRPCError({ code: 'FORBIDDEN', message: 'The provided exchange ID belongs to another user' })
					}

					return exchange
				}) ??
				ctx.db.exchange.create({
					data: {
						correspondentId: correspondent.id,
						userId: correspondent.forUserId,
						exchangeId: generateRandomUUID(),
					},
				})

			const { exchangeId } = await exchangePromise

			await ctx.db.message.create({
				data: {
					exchangeId,
					titleCK: input.titleCK.content,
					titleCKIV: input.titleCK.iv,
					categoryCK: input.categoryCK.content,
					categoryCKIV: input.categoryCK.iv,
					bodyCK: input.bodyCK.content,
					bodyCKIV: input.bodyCK.iv,
					isImportant: input.isImportant,
					// TODO: files
				},
			})

			return { exchangeId }
		}),
})
