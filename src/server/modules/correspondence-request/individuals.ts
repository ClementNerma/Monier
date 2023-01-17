import { z } from 'zod'
import { generateRandomUUID } from '../../../common/crypto'
import { createRouter } from '../../router'
import { failed, Fallible, success, zSymEncrypted } from '../../types'
import { authProcedure, publicProcedure } from '../auth'

export default createRouter({
	// From initiator to initiator
	generateCode: authProcedure
		.input(
			z.object({
				correspondenceInitPrivateKeyMK: zSymEncrypted,
				correspondenceInitPublicKey: z.string(),
			}),
		)
		.mutation<string>(async ({ ctx, input }) => {
			// TODO: use a passphrase here

			const correspondenceCode = generateRandomUUID()

			await ctx.db.individualLv1BCorrespondenceRequest.create({
				data: {
					forUserId: ctx.viewer.id,

					correspondenceInitID: generateRandomUUID(),
					correspondenceInitPrivateKeyMK: input.correspondenceInitPrivateKeyMK.content,
					correspondenceInitPrivateKeyMKIV: input.correspondenceInitPrivateKeyMK.iv,
					correspondenceInitPublicKey: input.correspondenceInitPublicKey,

					correspondenceCode,
				},
			})

			return correspondenceCode
		}),

	// From target to target
	createAnswered: authProcedure
		.input(
			z.object({
				correspondenceInitID: z.string(),
				correspondenceKeyMK: zSymEncrypted,
				serverUrl: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await ctx.db.individualLv2ACorrespondenceRequest.create({
				data: {
					forUserId: ctx.viewer.id,

					correspondenceInitID: input.correspondenceInitID,
					correspondenceKeyMK: input.correspondenceKeyMK.content,
					correspondenceKeyMKIV: input.correspondenceKeyMK.iv,

					serverUrl: input.serverUrl,
				},
			})
		}),

	// From target to initiator
	fillInfos: publicProcedure
		.input(
			z.object({
				correspondenceInitID: z.string(),
				correspondenceKeyCIPK: z.string(),
				serverUrl: z.string(),
				displayNameCK: zSymEncrypted,
			}),
		)
		.mutation<Fallible<void>>(async ({ ctx, input }) => {
			const request = await ctx.db.individualLv1BCorrespondenceRequest.findUnique({
				where: {
					correspondenceInitID: input.correspondenceInitID,
				},
			})

			if (!request) {
				return failed('Provided correspondence init. ID was not found')
			}

			await ctx.db.individualLv2BCorrespondenceRequest.create({
				data: {
					forUserId: request.forUserId,
					fromId: request.id,

					correspondenceKeyCIPK: input.correspondenceKeyCIPK,

					serverUrl: input.serverUrl,
					userDisplayNameCK: input.displayNameCK.content,
					userDisplayNameCKIV: input.displayNameCK.iv,
				},
			})

			return success(void 0)
		}),
})
