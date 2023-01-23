import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { generateRandomUUID } from '../../common/crypto'
import { createRouter } from '../router'
import { zSymEncrypted } from '../types'
import { authProcedure, publicProcedure } from './auth'
import { correspondentAuth, getCorrespondent } from './correspondents'
import type { Context } from '../context'
import type { Correspondent, Exchange, Message } from '@prisma/client'
import { createApiClient } from '../../common/trpc-client'

const messageInput = z.object({
	isImportant: z.boolean(),
	titleCK: zSymEncrypted,
	categoryCK: zSymEncrypted,
	bodyCK: zSymEncrypted,
	// TODO: files
})

export default createRouter({
	listMessages: authProcedure.query(({ ctx }) =>
		ctx.db.message.findMany({
			where: { exchange: { userId: ctx.viewer.id } },
			include: {
				exchange: {
					include: {
						correspondent: {
							select: {
								correspondenceKeyMK: true,
								correspondenceKeyMKIV: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		}),
	),

	// From sender (client) to sender (server)
	sendMessage: authProcedure
		.input(z.object({ correspondentId: z.string(), exchangeId: z.string().nullable(), message: messageInput }))
		.mutation(async ({ ctx, input }) => {
			const correspondent = await getCorrespondent(ctx.db, input.correspondentId, ctx.viewer)

			const exchange = await (input.exchangeId === null
				? ctx.db.exchange.create({
						data: {
							correspondentId: correspondent.id,
							userId: correspondent.forUserId,
							exchangeId: generateRandomUUID(),
						},
				  })
				: getExchange(ctx.db, correspondent, {
						exchangeId: input.exchangeId,
						userId: correspondent.forUserId,
				  }))

			const distantApi = createApiClient(correspondent.serverUrl)

			await distantApi.exchanges.receiveMessage.mutate({
				accessToken: correspondent.outgoingAccessToken,
				exchangeId: exchange.id,
				newExchange: input.exchangeId === null,
				message: input.message,
			})

			await createMessage(ctx.db, input.message, exchange)
		}),

	// From sender (server) to recipient (server)
	receiveMessage: publicProcedure
		.input(
			z.object({ accessToken: z.string(), exchangeId: z.string(), newExchange: z.boolean(), message: messageInput }),
		)
		.mutation(async ({ ctx, input }) => {
			const correspondent = await correspondentAuth(ctx.db, input.accessToken)

			const exchange = await (input.newExchange
				? ctx.db.exchange.create({
						data: {
							correspondentId: correspondent.id,
							userId: correspondent.forUserId,
							exchangeId: generateRandomUUID(),
						},
				  })
				: getExchange(ctx.db, correspondent, {
						exchangeId: input.exchangeId,
						userId: correspondent.forUserId,
				  }))

			await createMessage(ctx.db, input.message, exchange)

			return { exchangeId: exchange.id }
		}),
})

async function getExchange(
	db: Context['db'],
	correspondent: Correspondent,
	ids: {
		exchangeId: string
		userId: string
	},
): Promise<Exchange> {
	const exchange = await db.exchange.findUnique({
		where: { exchangeId: ids.exchangeId },
	})

	if (!exchange) {
		throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided exchange was not found' })
	}

	if (exchange.userId !== ids.userId) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'This exchange belongs to another user' })
	}

	if (exchange.correspondentId !== correspondent.id) {
		throw new TRPCError({ code: 'FORBIDDEN', message: 'This exchange is for another correspondent' })
	}

	return exchange
}

function createMessage(db: Context['db'], input: z.infer<typeof messageInput>, exchange: Exchange): Promise<Message> {
	return db.message.create({
		data: {
			exchangeId: exchange.id,
			titleCK: input.titleCK.content,
			titleCKIV: input.titleCK.iv,
			categoryCK: input.categoryCK.content,
			categoryCKIV: input.categoryCK.iv,
			bodyCK: input.bodyCK.content,
			bodyCKIV: input.bodyCK.iv,
			isImportant: input.isImportant,
		},
	})
}
