import { PrismaClient } from '@prisma/client'
import { atom } from 'nanostores'
import { map } from '../misc/utils'

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
	const authToken = map(req.headers.get('authorization'), (header) =>
		map(header.match(/^Bearer\s(.*)$/), (match) => match[1]!),
	)

	return { ...context.get(), authToken }
}
