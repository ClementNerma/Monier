import { randomBytes, randomUUID } from 'crypto'

export function generateRandomUUID(): string {
	return randomUUID()
}

export function generatePasswordSalt(): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		randomBytes(64, (err, salt) => {
			if (err) {
				reject(err)
			} else {
				resolve(salt)
			}
		})
	})
}
