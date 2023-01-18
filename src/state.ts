import { atom } from 'nanostores'
import { CONSTANTS } from './common/constants'
import { generateCookieEntry, getCookie } from './common/cookies'
import { exportKey, importSymKey, parseJWK } from './common/crypto'
import { map } from './common/utils'

export const globalAccessToken = atom(getCookie(document.cookie, CONSTANTS.cookieNames.accessToken))

globalAccessToken.listen((token) => {
	document.cookie = generateCookieEntry(CONSTANTS.cookieNames.accessToken, token ?? '')
})

export const globalMasterKey = atom(
	map(localStorage.getItem(CONSTANTS.localStoreItems.masterKey), (masterKey) => importSymKey(parseJWK(masterKey))),
)

globalMasterKey.listen(async (masterKey) =>
	masterKey !== null
		? localStorage.setItem(CONSTANTS.localStoreItems.masterKey, await exportKey(await masterKey))
		: localStorage.removeItem(CONSTANTS.localStoreItems.masterKey),
)
