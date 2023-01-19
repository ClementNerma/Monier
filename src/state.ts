import { CONSTANTS } from './common/constants'
import { generateCookieEntry, getCookie } from './common/cookies'
import { exportKey, importSymKey, parseJWK } from './common/crypto'
import { createStore } from './common/stores'
import { map } from './common/utils'

export const globalAccessToken = createStore(getCookie(document.cookie, CONSTANTS.cookieNames.accessToken))

globalAccessToken.listen((token) => {
	document.cookie = generateCookieEntry(CONSTANTS.cookieNames.accessToken, token ?? '')
})

export const globalMasterKey = createStore(
	map(localStorage.getItem(CONSTANTS.localStoreItems.masterKey), async (masterKey): Promise<CryptoKey> => {
		const parsed = parseJWK(masterKey)

		if (parsed instanceof Error) {
			localStorage.removeItem(CONSTANTS.localStoreItems.masterKey)
			throw new Error(`Found invalid JWK master key in local storage: ${parsed.message}`)
		}

		const result = await importSymKey(parsed)

		if (result instanceof Error) {
			// localStorage.removeItem(CONSTANTS.localStoreItems.masterKey)
			throw new Error(`Failed to import master key from local storage: ${result.message}`)
		}

		return result
	}),
)

globalMasterKey.listen(async (masterKey) =>
	masterKey !== null
		? localStorage.setItem(CONSTANTS.localStoreItems.masterKey, await exportKey(await masterKey))
		: localStorage.removeItem(CONSTANTS.localStoreItems.masterKey),
)

export function expectMasterKey(): Promise<CryptoKey> {
	const masterKey = globalMasterKey.get()

	if (!masterKey) {
		const msg = 'Error: no master key setup!'
		alert(msg)
		throw new Error(msg)
	}

	return masterKey
}
