export type Fallible<T> = { ok: true; data: T } | { ok: false; reason: string }

export const success = <T>(data: T): Fallible<T> => ({ ok: true, data })
export const failed = <T>(reason: string): Fallible<T> => ({ ok: false, reason })
