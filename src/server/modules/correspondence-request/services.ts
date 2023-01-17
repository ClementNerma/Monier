import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { generateRandomUUID } from '../../../common/crypto'
import { pick } from '../../../common/utils'
import { createRouter } from '../../router'
import { zSymEncrypted, SymEncrypted } from '../../types'
import { authProcedure } from '../auth'

export default createRouter({
	createCorrespondenceRequest: authProcedure
		.input(
			z.object({
				serverUrl: z.string(),
				correspondenceKeySPK: z.string(),
				correspondenceKeyMK: z.string(),
				correspondenceKeyMKIV: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.serviceCorrespondenceRequest.create({
				data: {
					forUserId: ctx.viewer.id,
					correspondenceRequestId: generateRandomUUID(),
					...pick(input, ['serverUrl', 'correspondenceKeySPK', 'correspondenceKeyMK', 'correspondenceKeyMKIV']),
				},
			})
		}),

	getCorrespondenceKeyMK: authProcedure
		.input(
			z.object({
				correspondenceRequestId: z.string(),
			}),
		)
		.query<{ correspondenceKey: SymEncrypted }>(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: pick(input, ['correspondenceRequestId']),
			})

			if (!request) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided correspondence request was not found' })
			}

			if (request.forUserId !== ctx.viewer.id) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
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

	confirmCorrespondence: authProcedure
		.input(
			z.object({
				correspondenceRequestId: z.string(),
				displayNameCK: zSymEncrypted,
			}),
		)
		.mutation<{ correspondenceId: string }>(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: pick(input, ['correspondenceRequestId']),
			})

			if (!request) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided correspondence request was not found' })
			}

			if (request.forUserId !== ctx.viewer.id) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Provided correspondence request belongs to another user',
				})
			}

			const correspondence = await ctx.db.correspondence.create({
				data: {
					accessToken: generateRandomUUID(),
					displayNameCK: input.displayNameCK.content,
					displayNameCKIV: input.displayNameCK.iv,
					isService: true,
					...pick(request, ['correspondenceKeyMK', 'correspondenceKeyMKIV']),
				},
			})

			return {
				correspondenceId: correspondence.id,
			}
		}),
})
