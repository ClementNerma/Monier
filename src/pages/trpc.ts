import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { APIRoute } from 'astro'
import { appRouter, createContext } from './trpc/[route]'

export const post: APIRoute = ({ request }) =>
	fetchRequestHandler({
		endpoint: '/trpc',
		req: request,
		router: appRouter,
		createContext,
	})
