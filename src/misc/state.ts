import { atom } from 'nanostores'
import type { COOKIE_NAMES } from '../common/constants'
import { generateCookieEntry, getCookie } from '../common/cookies'

type LocalStorageData = typeof COOKIE_NAMES[keyof typeof COOKIE_NAMES]

const readLocal = (data: LocalStorageData): string | null => getCookie(document.cookie, data) ?? null
const writeLocal = (data: LocalStorageData, value: string) => {
	document.cookie = generateCookieEntry(data, value)
}
const eraseLocal = (data: LocalStorageData) => {
	document.cookie = generateCookieEntry(data, '')
}

const localBackedStateItem = (name: LocalStorageData) => {
	const item = atom(readLocal(name))

	// Sync. writes to local storage
	item.listen((value) => (value === null ? eraseLocal(name) : writeLocal(name, value)))

	return item
}

export const accessToken = localBackedStateItem('accessToken')
