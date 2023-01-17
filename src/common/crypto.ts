const crypto = globalThis.crypto

export function generateRandomUUID(): string {
	return crypto.randomUUID()
}
