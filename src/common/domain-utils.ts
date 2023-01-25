import { z } from 'zod'

export const zSymEncrypted = z.object({
	content: z.string(),
	iv: z.string(),
})
