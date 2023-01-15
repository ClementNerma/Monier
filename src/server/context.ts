import { PrismaClient } from '@prisma/client'
import { atom } from 'nanostores'
import { getCookie } from '../common/cookies'
import { map } from '../common/utils'

type GlobalContext = {
	db: PrismaClient
}

const context = atom<GlobalContext>({
	db: new PrismaClient(),
})

export type Context = GlobalContext & {
	authToken: string | null
}

export const createContext = ({ req }: { req: Request }): Context => {
	const authToken = map(req.headers.get('cookie'), (header) => getCookie(header, 'accessToken'))

	return { ...context.get(), authToken }
}
