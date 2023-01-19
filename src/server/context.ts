import { PrismaClient, Session, User } from '@prisma/client'
import type { AstroGlobal } from 'astro'
import { getSession } from './modules/auth'

export type GlobalContext = {
	db: PrismaClient
}

const context: GlobalContext = Object.freeze({
	db: new PrismaClient(),
})

export type Context = GlobalContext & {
	cookies: string | null
	server?: {
		resolvedSession: (Session & { user: User }) | null
	}
}

export const createContext = ({ req }: { req: Request }): Context => ({
	...context,
	cookies: req.headers.get('cookie'),
})

export const createServerContext = async (astro: AstroGlobal): Promise<Context> => {
	return {
		...context,
		cookies: null,
		server: {
			resolvedSession: await getSession(astro.cookies, context.db),
		},
	}
}
