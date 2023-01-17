import { createRouter } from '../router'
import { z } from 'zod'
import { authProcedure, publicProcedure } from './auth'
import { failed, Fallible, success } from '../types'
import { generateRandomUUID } from '../utils/crypto'

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
		.mutation(async ({ input, ctx: { db } }): Promise<Fallible<void>> => {
			const existing = await db.user.count({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (existing > 0) {
				return failed('This username is already taken')
			}

			await db.user.create({
				data: {
					usernameHash: input.usernameHash,
					passwordProof: input.passwordProof,
					masterKeyPK: input.masterKeyPK,
				},
			})

			return success(void 0)
		}),

	// Create a session
	login: publicProcedure
		.input(
			z.object({
				usernameHash: z.string(),
				passwordProof: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }): Promise<Fallible<string>> => {
			const user = await ctx.db.user.findUnique({
				where: {
					usernameHash: input.usernameHash,
				},
			})

			if (!user) {
				return failed('Provided user was not found')
			}

			if (user.passwordProof !== input.passwordProof) {
				return failed('Invalid password proof provided')
			}

			const session = await ctx.db.session.create({
				data: {
					accessToken: generateRandomUUID(),
					userId: user.id,
				},
			})

			return success(session.id)
		}),

	// Destroy current session
	logout: authProcedure.mutation(async ({ ctx }): Promise<Fallible<void>> => {
		await ctx.db.session.delete({
			where: {
				id: ctx.session.id,
			},
		})

		return success(void 0)
	}),
})
