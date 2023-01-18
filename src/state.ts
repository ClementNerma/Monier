import { atom } from 'nanostores'
import { generateCookieEntry, getCookie } from './common/cookies'
import { deserializeBuffer, serializeBuffer } from './common/crypto'
import { map } from './common/utils'

const COOKIE_NAMES = {
	accessToken: 'accessToken',
}

const LOCAL_STORE_ITEMS = {
	masterKey: 'masterKey',
}

export const globalAccessToken = atom(getCookie(document.cookie, COOKIE_NAMES.accessToken))

globalAccessToken.listen((token) => {
	document.cookie = generateCookieEntry(COOKIE_NAMES.accessToken, token ?? '')
})

export const globalMasterKey = atom(map(localStorage.getItem(LOCAL_STORE_ITEMS.masterKey), deserializeBuffer))

globalMasterKey.listen((masterKey) =>
	masterKey !== null
		? localStorage.setItem(LOCAL_STORE_ITEMS.masterKey, serializeBuffer(masterKey))
		: localStorage.removeItem(LOCAL_STORE_ITEMS.masterKey),
)
