import { randomBytes, pbkdf2, timingSafeEqual } from 'crypto'

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

export function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		pbkdf2(password, salt, 1_000_000, 64, 'sha512', (err, hash) => {
			if (err) {
				return reject(err)
			}

			resolve(hash)
		})
	})
}

export async function verifyPassword(hash: Buffer, salt: Buffer, toCheck: string): Promise<boolean> {
	return timingSafeEqual(hash, await hashPassword(toCheck, salt))
}
