import { atom } from 'nanostores'
import { setupLoginRedirect } from './login-redirect'

type LocalStorageData = 'accessToken'

const readLocal = (data: LocalStorageData): string | null => localStorage.getItem(data)
const writeLocal = (data: LocalStorageData, value: string) => localStorage.setItem(data, value)
const eraseLocal = (data: LocalStorageData) => localStorage.removeItem(data)

const localBackedStateItem = (name: LocalStorageData) => {
	const item = atom(readLocal(name))

	// Sync. writes to local storage
	item.listen((value) => (value === null ? eraseLocal(name) : writeLocal(name, value)))

	return item
}

export const accessToken = localBackedStateItem('accessToken')

setupLoginRedirect(accessToken)
