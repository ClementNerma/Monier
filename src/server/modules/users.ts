import { createRouter } from '../router'
import { z } from 'zod'
import { authProcedure, publicProcedure } from './auth'
import { TRPCError } from '@trpc/server'
import { zSymEncrypted } from '../../common/domain-utils'
import { pick } from '../../common/utils'
import { generateRandomUUID } from '../../common/crypto'

export default createRouter({
	// Register as a new user
	register: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
				passwordSalt: z.string(),
				passwordProofPlainText: z.string(),
				passwordProofPK: zSymEncrypted,
				masterKeyPK: zSymEncrypted,
				displayNameMK: zSymEncrypted,
			}),
		)
		.mutation<void>(async ({ input, ctx: { db } }) => {
			const existing = await db.user.count({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (existing > 0) {
				throw new TRPCError({ code: 'CONFLICT', message: 'This username is already taken' })
			}

			await db.user.create({
				data: {
					usernameHash: input.usernameHash,
					passwordSalt: input.passwordSalt,
					passwordProofPlainText: input.passwordProofPlainText,
					passwordProofPK: input.passwordProofPK.content,
					passwordProofPKIV: input.passwordProofPK.iv,
					masterKeyPK: input.masterKeyPK.content,
					masterKeyPKIV: input.masterKeyPK.iv,
					displayNameMK: input.displayNameMK.content,
					displayNameMKIV: input.displayNameMK.iv,
				},
			})
		}),

	// Get login informations to actually login
	getLoginInformations: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'The provided username was not found' })
			}

			return pick(user, ['passwordSalt', 'passwordProofPlainText', 'passwordProofPKIV'])
		}),

	login: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
				passwordProofPK: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const user = await ctx.db.user.findUnique({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'The provided username was not found' })
			}

			if (input.passwordProofPK !== user.passwordProofPK) {
				throw new TRPCError({ code: 'FORBIDDEN', message: 'The provided password (proof) is invalid' })
			}

			const accessToken = generateRandomUUID()

			await ctx.db.session.create({
				data: {
					userId: user.id,
					accessToken,
				},
			})

			return {
				user: pick(user, ['masterKeyPK', 'masterKeyPKIV']),
				accessToken,
			}
		}),

	// Destroy current session
	logout: authProcedure.mutation<void>(async ({ ctx }) => {
		await ctx.db.session.delete({
			where: {
				id: ctx.session.id,
			},
		})
	}),
})
