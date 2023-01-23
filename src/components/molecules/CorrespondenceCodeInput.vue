<script setup lang="ts">
import { ref } from 'vue';
import { serializeBuffer } from '../../common/base64';
import { generateSymmetricKey, exportKey, encryptAsym } from '../../common/crypto';
import { decryptTextSymFromTRPC, importKeyFromTRPC, encryptSymForTRPC, encryptTextSymForTRPC } from '../../common/crypto-trpc';
import { createApiClient } from '../../common/trpc-client';
import { expectOk, textToBuffer } from '../../common/utils';
import { expectMasterKey } from '../../state';
import { trpc } from '../../trpc-client';

const props = defineProps<{
	displayNameMK: string
	displayNameMKIV: string
}>()

const correspondenceCode = ref('')
const serverUrl = ref(location.origin)
const status = ref('')

async function submit() {
	status.value = 'Decrypting local personal informations...'

	const masterKey = await expectMasterKey()

	const displayName = expectOk(await decryptTextSymFromTRPC(props.displayNameMK, props.displayNameMKIV, masterKey))

	status.value = 'Contacting distant server...'

	const distantUrl = serverUrl.value
	const distantApi = createApiClient(distantUrl)

	const { correspondenceInitID, correspondenceInitPublicKeyJWK } =
		await distantApi.correspondenceRequest.individuals.getPublicKey.query({
			correspondenceCode: correspondenceCode.value,
		})

	const correspondenceInitPublicKey = expectOk(await importKeyFromTRPC(correspondenceInitPublicKeyJWK, 'asymPub'))

	status.value = 'Generating a correspondence key...'

	const correspondenceKey = await generateSymmetricKey()
	const correspondenceKeyJWK = textToBuffer(await exportKey(correspondenceKey))

	status.value = 'Answering the correspondence request...'

	await trpc.correspondenceRequest.individuals.createAnswered.mutate({
		correspondenceInitID,
		correspondenceKeyMK: await encryptSymForTRPC(correspondenceKeyJWK, masterKey),
		correspondenceKeyCIPK: serializeBuffer(await encryptAsym(correspondenceKeyJWK, correspondenceInitPublicKey)),
		targetDisplayNameCK: await encryptTextSymForTRPC(displayName, correspondenceKey),
		serverUrl: distantUrl,
	})

	correspondenceCode.value = ''
	serverUrl.value = ''
	status.value = 'Success!'
}
</script>

<template>
	<p v-if="status">{{ status }}</p>

	<form @submit="e => e.preventDefault()">
		<label>Correspondence code</label>
		<input type="text" v-model="correspondenceCode" autocomplete='off' required />

		<label>Server URL</label>
		<input type="url" v-model="serverUrl" autocomplete='url' required />

		<input type="submit" @click="submit" value="Submit" />
	</form>
</template>

<style scoped>
form {
	display: grid;
	grid-template-columns: fit-content(100%) fit-content(100%);
	column-gap: 1rem;
	row-gap: 0.5rem;
}
</style>
