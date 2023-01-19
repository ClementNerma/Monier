export const isBrowser = typeof window !== 'undefined'

export function map<T, U>(value: T | null | undefined, mapper: (value: T) => U): U | null {
	return value !== null && value !== undefined ? mapper(value) : null
}

export function pick<O extends object, P extends keyof O>(obj: O, props: P[]): Pick<O, P> {
	// @ts-ignore
	return Object.fromEntries(Object.entries(obj).filter(([prop]) => props.includes(prop)))
}

export function textToBuffer(input: string): Uint8Array {
	const encoder = new TextEncoder()
	return encoder.encode(input)
}

export function bufferToText(input: Uint8Array): string | Error {
	const decoder = new TextDecoder()
	return fallibleSync(() => decoder.decode(input))
}

export function mapUnion<D extends string>(discr: D): <T>(mapping: { [variant in D]: T }) => T {
	return (mapping) => mapping[discr]
}

export function fallibleSync<T>(fn: () => T): T | Error {
	try {
		return fn()
	} catch (e: unknown) {
		return e instanceof Error ? e : new Error('<unknown error type>')
	}
}

export async function fallible<T>(fn: () => Promise<T>): Promise<T | Error> {
	try {
		return await fn()
	} catch (e: unknown) {
		return e instanceof Error ? e : new Error('<unknown error type>')
	}
}

export function expectOk<T>(value: T | Error, message?: string): T {
	if (value instanceof Error) {
		throw new Error(`${message ? `${message}\n` : ''}${value.message}`)
	}

	return value
}

export async function parallel<O extends { [key: string]: Promise<unknown> }>(obj: O): Promise<{
	[Key in keyof O]: Awaited<O[Key]>
}> {
	const entries = Object.entries(obj)
	const promises = await Promise.all(entries.map(([_, promise]) => promise))
	const promised = entries.map(([key, _], i) => [key, promises[i]])
	return Object.fromEntries(promised)
}

export type MaybeObj<T extends object> = T | {}
