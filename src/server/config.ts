import { z } from 'zod'

const configParser = z.object({
	SESSION_EXPIRES_AFTER_HOURS: z.number().int().gt(0),
})

export const CONFIG = configParser.parse(process.env)
