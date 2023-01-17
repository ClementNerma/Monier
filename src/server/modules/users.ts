import { createRouter } from '../router'
import { z } from 'zod'
import { authProcedure, publicProcedure } from './auth'
import { generateRandomUUID } from '../../common/crypto'
import { TRPCError } from '@trpc/server'

export default createRouter({
	// Register as a new user
	register: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
				passwordProof: z.string(),
				masterKeyPK: z.string(),
			}),
		)
		.mutation(async ({ input, ctx: { db } }) => {
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
					passwordProof: input.passwordProof,
					masterKeyPK: input.masterKeyPK,
				},
			})
		}),

	// Create a session
	login: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
				passwordProof: z.string(),
			}),
		)
		.mutation<string>(async ({ input, ctx }) => {
			const user = await ctx.db.user.findUnique({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (!user) {
				throw new TRPCError({ code: 'NOT_FOUND', message: 'Provided user was not found' })
			}

			if (user.passwordProof !== input.passwordProof) {
				throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid password proof provided' })
			}

			const session = await ctx.db.session.create({
				data: {
					accessToken: generateRandomUUID(),
					userId: user.id,
				},
			})

			return session.id
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
