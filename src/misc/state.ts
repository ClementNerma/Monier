import { atom } from 'nanostores'
import { getCookie, setCookie, removeCookie } from 'typescript-cookie'

type LocalStorageData = 'accessToken'

const readLocal = (data: LocalStorageData): string | null => getCookie(data) ?? null
const writeLocal = (data: LocalStorageData, value: string) => setCookie(data, value)
const eraseLocal = (data: LocalStorageData) => removeCookie(data)

const localBackedStateItem = (name: LocalStorageData) => {
	const item = atom(readLocal(name))

	// Sync. writes to local storage
	item.listen((value) => (value === null ? eraseLocal(name) : writeLocal(name, value)))

	return item
}

export const accessToken = localBackedStateItem('accessToken')
