export const isBrowser = typeof window !== 'undefined'

export function map<T, U>(value: T | null | undefined, mapper: (value: T) => U): U | null {
	return value !== null && value !== undefined ? mapper(value) : null
}

export function pick<O extends object, P extends keyof O>(obj: O, props: P[]): Pick<O, P> {
	// @ts-ignore
	return Object.fromEntries(Object.entries(obj).filter(([prop]) => props.includes(prop)))
}
