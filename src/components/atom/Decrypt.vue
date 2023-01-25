<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { expectMasterKey } from '../../state';
import { decryptTextSymFromTRPC, importKeyFromTRPC } from '../../common/crypto-trpc';
import ErrorMessage from './ErrorMessage.vue';
import type { SymEncrypted } from '../../common/crypto-trpc';

const props = defineProps<{
	data: SymEncrypted
	decrypt: Decrypt
}>()

type Decrypt =
	// The data is encrypted with the Master Key
	| { with: 'masterKey' }
	// Provided CryptoKey
	| { with: 'direct'; key: CryptoKey }
	// Plain text JWK key
	| { with: 'jwk'; content: string }
	// JWK symmetryc key encrypted with the Master Key
	| { with: 'jwkMK'; content: SymEncrypted }

async function getKey(key: Decrypt): Promise<CryptoKey | Error> {
	if (key.with === 'direct') {
		return key.key
	}

	if (key.with === 'jwk' || key.with === 'jwkMK') {
		// const existing = importedMKKeys.get(key.content)

		// if (existing) {
		// 	return existing
		// }
	}

	if (key.with === 'masterKey' || key.with === 'jwkMK') {
		const masterKey = await expectMasterKey()

		if (key.with === 'masterKey') {
			return masterKey
		}

		const keyJWK = await decryptTextSymFromTRPC(key.content.content, key.content.iv, masterKey)

		if (keyJWK instanceof Error) {
			return new Error('Failed to decode the second layer encryption key')
		}

		key = { with: 'jwk', content: keyJWK }
	}

	const imported = await importKeyFromTRPC(key.content, 'sym')

	if (imported instanceof Error) {
		return new Error('Failed to import the provided key')
	}

	// TODO: store in cache

	return imported
}

const error = ref('')

// Use a non-breaking space by default to ensure layout won't change after actual loading
const display = ref('\xa0')

onMounted(async () => {
	const key = await getKey(props.decrypt)

	if (key instanceof Error) {
		error.value = key.message
		return
	}

	const result = await decryptTextSymFromTRPC(props.data.content, props.data.iv, key)

	if (result instanceof Error) {
		error.value = result.message
	} else {
		display.value = result
	}
})
</script>

<template>
	<ErrorMessage v-if="error" :message="error" />

	{{ display }}
</template>
