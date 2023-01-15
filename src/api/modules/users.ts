import { createRouter } from '../router'
import { z } from 'zod'
import { authProcedure, publicProcedure } from './auth'
import { failed, success } from '../types'
import { hashPassword, verifyPassword, generatePasswordSalt } from '../../crypto'

export default createRouter({
	// Create a session
	login: publicProcedure
		.input(
			z.object({
				email: z.string(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const user = await ctx.db.user.findUnique({
				where: {
					email: input.email,
				},
			})

			if (!user) {
				return failed('Provided user was not found')
			}

			const passwordMatches = await verifyPassword(
				Buffer.from(user.passwordHash, 'hex'),
				Buffer.from(user.passwordSalt, 'hex'),
				input.password,
			)

			if (!passwordMatches) {
				return failed('Wrong password')
			}

			const session = await ctx.db.session.create({
				data: {
					userId: user.id,
				},
			})

			return success(session.id)
		}),

	// Destroy current session
	logout: authProcedure.mutation(async ({ ctx }) => {
		await ctx.db.session.delete({
			where: {
				id: ctx.session.id,
			},
		})

		return success(void 0)
	}),

	// Register as a new user
	register: publicProcedure
		.input(
			z.object({
				email: z.string(),
				password: z.string(),
			}),
		)
		.mutation(async ({ input, ctx: { db } }) => {
			if (input.password.trim().length === 0) {
				return failed('Password is empty')
			}

			const existing = await db.user.count({
				where: {
					email: input.email,
				},
			})

			if (existing > 0) {
				return failed('This e-mail address is already taken')
			}

			const passwordSalt = await generatePasswordSalt()
			const passwordHash = await hashPassword(input.password, passwordSalt)

			await db.user.create({
				data: {
					email: input.email,
					passwordHash: passwordHash.toString('hex'),
					passwordSalt: passwordSalt.toString('hex'),
				},
			})

			return success(void 0)
		}),
})
