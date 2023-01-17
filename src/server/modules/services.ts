import { z } from 'zod'
import { generateRandomUUID } from '../../common/crypto'
import { pick } from '../../common/utils'
import { createRouter } from '../router'
import { failed, FallibleSingle, success, zSymEncrypted, SymEncrypted } from '../types'
import { authProcedure } from './auth'

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
		.query<FallibleSingle<'correspondenceKey', SymEncrypted>>(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: pick(input, ['correspondenceRequestId']),
			})

			if (!request) {
				return failed('Provided correspondence request was not found')
			}

			if (request.forUserId !== ctx.viewer.id) {
				return failed('Provided correspondence request belongs to another user')
			}

			return success({
				correspondenceKey: {
					content: request.correspondenceKeyMK,
					iv: request.correspondenceKeyMKIV,
				},
			})
		}),

	confirmCorrespondence: authProcedure
		.input(
			z.object({
				correspondenceRequestId: z.string(),
				displayNameCK: zSymEncrypted,
			}),
		)
		.mutation<FallibleSingle<'correspondenceId', string>>(async ({ ctx, input }) => {
			const request = await ctx.db.serviceCorrespondenceRequest.findUnique({
				where: pick(input, ['correspondenceRequestId']),
			})

			if (!request) {
				return failed('Provided correspondence request was not found')
			}

			if (request.forUserId !== ctx.viewer.id) {
				return failed('Provided correspondence request belongs to another user')
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

			return success({
				correspondenceId: correspondence.id,
			})
		}),
})
