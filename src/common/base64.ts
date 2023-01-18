/**
 * Adapted from https://github.com/niklasvh/base64-arraybuffer
 * Will be remade using a WebAssembly module later on for performance
 */

import { CONSTANTS } from './constants'

export function serializeBuffer(bytes: Uint8Array): string {
	const len = bytes.length

	const base64: string[] = []

	for (let i = 0; i < len; i += 3) {
		base64.push(CHARS[bytes[i] >> 2])
		base64.push(CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)])
		base64.push(CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)])
		base64.push(CHARS[bytes[i + 2] & 63])
	}

	const str = base64.join('')

	const finalStr =
		len % 3 === 2
			? `${str.substring(0, str.length - 1)}=`
			: len % 3 === 1
			? `${str.substring(0, str.length - 2)}==`
			: str

	return `${CONSTANTS.bufferSerialization.prefix}${finalStr}${CONSTANTS.bufferSerialization.suffix}`
}

export function deserializeBuffer(serialized: string): Uint8Array {
	if (!serialized.startsWith(CONSTANTS.bufferSerialization.prefix)) {
		throw new Error(`Provided serialized content does not contain the expected prefix: ${serialized}`)
	}

	if (!serialized.endsWith(CONSTANTS.bufferSerialization.suffix)) {
		throw new Error(`Provided serialized content does not contain the expected suffix: ${serialized}`)
	}

	const stripped = serialized.substring(
		CONSTANTS.bufferSerialization.prefix.length,
		serialized.length - CONSTANTS.bufferSerialization.suffix.length,
	)

	let bufferLength = stripped.length * 0.75
	const len = stripped.length

	if (stripped.at(-1) === '=') {
		bufferLength -= 1

		if (stripped.at(-2) === '=') {
			bufferLength -= 1
		}
	}

	const bytes = new Uint8Array(bufferLength)

	let p = 0

	for (let i = 0; i < len; i += 4) {
		const encoded1 = LOOKUP[stripped.charCodeAt(i)]
		const encoded2 = LOOKUP[stripped.charCodeAt(i + 1)]
		const encoded3 = LOOKUP[stripped.charCodeAt(i + 2)]
		const encoded4 = LOOKUP[stripped.charCodeAt(i + 3)]

		bytes[p++] = (encoded1 << 2) | (encoded2 >> 4)
		bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2)
		bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63)
	}

	return bytes
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const LOOKUP = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256)

for (let i = 0; i < CHARS.length; i++) {
	LOOKUP[CHARS.charCodeAt(i)] = i
}
