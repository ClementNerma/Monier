import { PrismaClient } from '@prisma/client'
import type { AstroCookies } from 'astro/dist/core/cookies'
import { atom } from 'nanostores'

type GlobalContext = {
	db: PrismaClient
}

const context = atom<GlobalContext>({
	db: new PrismaClient(),
})

export type Context = GlobalContext & {
	origin: 'client' | 'server'
	cookies: string | AstroCookies | null
}

export const createContext = ({ req }: { req: Request }): Context => ({
	...context.get(),
	origin: 'client',
	cookies: req.headers.get('cookie'),
})

export const createServerContext = (cookies: AstroCookies): Context => ({
	...context.get(),
	origin: 'server',
	cookies,
})
