import { initTRPC } from '@trpc/server'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { APIRoute } from 'astro'
import { createStore } from 'solid-js/store'
import { z } from 'zod'

type Context = {
	counter: number
}

const [context] = createStore({
	counter: 0,
})

const t = initTRPC.context<Context>().create()

export const appRouter = t.router({
	getCounter: t.procedure.query(({ ctx }) => ctx.counter),
	incCounter: t.procedure.mutation(({ ctx }) => {
		ctx.counter += 1
	}),
	decCounter: t.procedure.mutation(({ ctx }) => {
		ctx.counter -= 1
	}),
	setCounter: t.procedure.input(z.number()).mutation(({ ctx, input }) => {
		ctx.counter = input
	}),
	resetCounter: t.procedure.mutation(({ ctx }) => {
		ctx.counter = 0
	}),
})

export type AppRouter = typeof appRouter

export const all: APIRoute = ({ request }) =>
	fetchRequestHandler({
		router: appRouter,
		endpoint: '/trpc',
		req: request,
		createContext: () => context,
	})
