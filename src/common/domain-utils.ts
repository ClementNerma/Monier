import { z } from 'zod'
import type { SymEncrypted } from './crypto-trpc'

export const zSymEncrypted = z.object({
	content: z.string(),
	iv: z.string(),
})

type EncryptedPropNames<O extends object> = {
	[Key in keyof O]: Key extends string ? (O extends { [_ in Key | `${Key}IV`]: string } ? Key : never) : never
}[keyof O]

export function pickEncrypted<O extends object>(obj: O, prop: EncryptedPropNames<O>): SymEncrypted {
	return {
		// @ts-ignore
		content: obj[prop],
		// @ts-ignore
		iv: obj[`${prop}IV`],
	}
}
