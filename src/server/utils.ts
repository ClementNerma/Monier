import { z } from 'zod'
import { map } from '../common/utils'

export const paginationInput = z.object({
	cursor: z.string().nullable(),
	limit: z.number(),
	order: z.enum(['asc', 'desc']),
})

export type PaginationInput = z.infer<typeof paginationInput>

export function paginationParams(p: PaginationInput) {
	return {
		...(p.cursor ? { cursor: { id: p.cursor } } : {}),
		orderBy: { createdAt: p.order },
		take: p.limit + 1,
	}
}

export async function paginateResponse<T extends { id: string; createdAt: Date }>(
	p: PaginationInput,
	dataPromise: Promise<T[]>,
) {
	const data = await dataPromise

	return {
		nextPageCursor: map(data[p.limit], (item) => item.id),
		items: data,
	}
}
