import { CONSTANTS } from './common/constants'
import { generateCookieEntry, getCookie } from './common/cookies'
import { exportKey, importKey, parseJWK } from './common/crypto'
import { createStore } from './common/stores'

function getSavedCredentials() {
	const accessToken = getCookie(document.cookie, CONSTANTS.cookieNames.accessToken)

	if (!accessToken) {
		return null
	}

	const masterKeyJWK = localStorage.getItem(CONSTANTS.localStoreItems.masterKey)

	if (!masterKeyJWK) {
		return null
	}

	const parsed = parseJWK(masterKeyJWK)

	if (parsed instanceof Error) {
		localStorage.removeItem(CONSTANTS.localStoreItems.masterKey)
		throw new Error(`Found invalid JWK master key in local storage: ${parsed.message}`)
	}

	return importKey(parsed, 'sym').then((masterKey) => {
		if (masterKey instanceof Error) {
			// localStorage.removeItem(CONSTANTS.localStoreItems.masterKey)
			throw new Error(`Failed to import master key from local storage: ${masterKey.message}`)
		}

		return {
			accessToken,
			masterKey,
		}
	})
}

export const savedCredentials = createStore(getSavedCredentials())

savedCredentials.listen(async (promise) => {
	if (!promise) {
		document.cookie = generateCookieEntry(CONSTANTS.cookieNames.accessToken, '')
		localStorage.removeItem(CONSTANTS.localStoreItems.masterKey)
		return
	}

	const { accessToken, masterKey } = await promise

	const exportedMasterKey = await exportKey(masterKey)

	document.cookie = generateCookieEntry(CONSTANTS.cookieNames.accessToken, accessToken)
	localStorage.setItem(CONSTANTS.localStoreItems.masterKey, exportedMasterKey)
})

export async function expectMasterKey(): Promise<CryptoKey> {
	const credentials = savedCredentials.get()

	if (!credentials) {
		throw new Error('Error: no credentials setup!')
	}

	const { masterKey } = await credentials

	return masterKey
}

export const importedMKKeys = new Map<string, CryptoKey>()
