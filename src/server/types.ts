import { z } from 'zod'

export type SymEncrypted = z.infer<typeof zSymEncrypted>

export const zSymEncrypted = z.object({
	content: z.string(),
	iv: z.string(),
})
