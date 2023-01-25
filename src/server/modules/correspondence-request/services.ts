import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { generateRandomUUID } from '../../../common/crypto'
import { pick } from '../../../common/utils'
import { createRouter } from '../../router'
import { zSymEncrypted } from '../../../common/domain-utils'
import { authProcedure } from '../auth'

export default createRouter({
	// From target (client) to target (server)
	createCorrespondenceRequest: authProcedure
		.input(
			z.object({
				serverUrl: z.string(),
				correspondenceKeySPK: z.string(),
				correspondenceKeyMK: z.string(),
				correspondenceKeyMKIV: z.string(),
			}),
		)
		.mutation<void>(async ({ ctx, input }) => {
			await ctx.db.serviceCorrespondenceRequest.create({
				data: {
					forUserId: ctx.viewer.id,
					correspondenceRequestId: generateRandomUUID(),
					...pick(input, ['serverUrl', 'correspondenceKeySPK', 'correspondenceKeyMK', 'correspondenceKeyMKIV']),
				},
			})
		}),

	// From target (server) to target (client)
	getCorrespondenceKeyMK: authProcedure
		.input(
			z.object({
				correspondenceRequestId: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: {
					correspondenceRequestId: input.correspondenceRequestId,
				},
			})

			if (!request) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided correspondence request was not found' })
			}

			if (request.forUserId !== ctx.viewer.id) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Provided correspondence request belongs to another user',
				})
			}

			return {
				correspondenceKey: {
					content: request.correspondenceKeyMK,
					iv: request.correspondenceKeyMKIV,
				},
			}
		}),

	// From target (client) to target (server)
	confirmCorrespondence: authProcedure
		.input(
			z.object({
				correspondenceRequestId: z.string(),
				displayNameCK: zSymEncrypted,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: pick(input, ['correspondenceRequestId']),
			})

			if (!request) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided correspondence request was not found' })
			}

			if (request.forUserId !== ctx.viewer.id) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Provided correspondence request belongs to another user',
				})
			}

			const incomingAccessToken = generateRandomUUID()

			const correspondent = await ctx.db.correspondent.create({
				data: {
					forUserId: ctx.viewer.id,

					incomingAccessToken,
					outgoingAccessToken: generateRandomUUID(),

					isService: true,
					isInitiator: false,

					displayNameCK: input.displayNameCK.content,
					displayNameCKIV: input.displayNameCK.iv,
					correspondenceKeyMK: request.correspondenceKeyMK,
					correspondenceKeyMKIV: request.correspondenceKeyMKIV,

					serverUrl: request.serverUrl,
				},
			})

			return {
				correspondentId: correspondent.id,
				incomingAccessToken,
			}
		}),
})
