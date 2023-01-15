import { PrismaClient } from '@prisma/client'
import { map } from '../utils'

type GlobalContext = {
	db: PrismaClient
}

const context: GlobalContext = {
	db: new PrismaClient(),
}

export type Context = GlobalContext & {
	authToken: string | null
}

export const getContext = ({ req }: { req: Request }): Context => {
	const authToken = map(req.headers.get('authorization'), (header) =>
		map(header.match(/^Bearer\s(.*)$/), (match) => match[1]),
	)

	return { ...context, authToken }
}
