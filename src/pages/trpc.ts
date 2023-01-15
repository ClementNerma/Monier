import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { APIRoute } from 'astro'
import { appRouter } from '../api'
import { getContext } from '../api/context'

export const post: APIRoute = ({ request }) =>
	fetchRequestHandler({
		endpoint: '/trpc',
		req: request,
		router: appRouter,
		createContext: getContext,
	})
