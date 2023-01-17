import { z } from 'zod'

export type Fallible<T> = { ok: true; data: T } | { ok: false; reason: string }
export type FallibleSingle<K extends string, T> = Fallible<{ [key in K]: T }>

export const success = <T>(data: T): Fallible<T> => ({ ok: true, data })
export const failed = <T>(reason: string): Fallible<T> => ({ ok: false, reason })

export type SymEncrypted = z.infer<typeof zSymEncrypted>

export const zSymEncrypted = z.object({
	content: z.string(),
	iv: z.string(),
})
