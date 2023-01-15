export function parseCookies(source: string): Map<string, string> {
	const cookies = new Map<string, string>()

	if (source.trim().length === 0) {
		return cookies
	}

	for (const entry of source.split(';')) {
		const [cookieName, cookieValue, _] = entry.split('=')

		if (cookieName === undefined || cookieValue === undefined || _ !== undefined) {
			console.error(`Invalid cookie entry: ${entry}`)
			continue
		}

		if (cookieValue !== '') {
			cookies.set(cookieName.trim(), decodeURIComponent(cookieValue))
		}
	}

	return cookies
}

export function getCookie(source: string, name: string): string | null {
	return parseCookies(source).get(name) ?? null
}

export function generateCookieEntry(name: string, value: string): string {
	return `${name}=${encodeURIComponent(value)}`
}
