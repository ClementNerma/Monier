import { PrismaClient, Session, User } from '@prisma/client'
import type { AstroGlobal } from 'astro'
import { atom } from 'nanostores'
import { getSession } from './modules/auth'

export type GlobalContext = {
	db: PrismaClient
}

const context = atom<GlobalContext>({
	db: new PrismaClient(),
})

export type Context = GlobalContext & {
	cookies: string | null
	server?: {
		resolvedSession: (Session & { user: User }) | null
	}
}

export const createContext = ({ req }: { req: Request }): Context => ({
	...context.get(),
	cookies: req.headers.get('cookie'),
})

export const createServerContext = async (astro: AstroGlobal): Promise<Context> => {
	const ctx = context.get()

	return {
		...ctx,
		cookies: null,
		server: {
			resolvedSession: await getSession(astro.cookies, ctx.db),
		},
	}
}
