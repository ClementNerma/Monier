<script setup lang="ts">
import { ref } from 'vue';
import ErrorMessage from '../atom/ErrorMessage.vue';
import { decryptSym, deriveKeyFromPassword, encryptSym, hash, importKey, parseJWK } from '../../common/crypto';
import { bufferToText, expectOk, fallible, textToBuffer } from '../../common/utils';
import { deserializeBuffer, serializeBuffer } from '../../common/base64';
import { savedCredentials } from '../../state';
import { trpc } from '../../trpc-client';

const username = ref('')
const password = ref('')
const error = ref('')

async function login() {
	error.value = ''

	const usernameHash = await hash(expectOk(textToBuffer(username.value)))

	const loginInfos = await fallible(() =>
		trpc.users.getLoginInformations.query({
			usernameHash,
		}),
	)

	if (loginInfos instanceof Error) {
		error.value = loginInfos.message
		return
	}

	const { passwordProofPlainText, passwordProofPKIV, passwordSalt } = loginInfos

	const passwordKey = await deriveKeyFromPassword(
		expectOk(textToBuffer(password.value)),
		expectOk(deserializeBuffer(passwordSalt)),
	)

	const passwordProofPK = await encryptSym(
		expectOk(deserializeBuffer(passwordProofPlainText)),
		passwordKey,
		expectOk(deserializeBuffer(passwordProofPKIV)),
	)

	const res = await fallible(() =>
		trpc.users.login.mutate({
			usernameHash,
			passwordProofPK: serializeBuffer(passwordProofPK),
		}),
	)

	if (res instanceof Error) {
		error.value = res.message
		return
	}

	const {
		accessToken,
		user: { masterKeyPK, masterKeyPKIV },
	} = res

	const decryptedMasterKey = await decryptSym(
		expectOk(deserializeBuffer(masterKeyPK)),
		expectOk(deserializeBuffer(masterKeyPKIV)),
		passwordKey,
	)

	const masterKeyJWK = expectOk(bufferToText(expectOk(decryptedMasterKey)))
	const rawMasterKey = expectOk(parseJWK(masterKeyJWK))

	const masterKey = expectOk(
		await fallible(() => importKey(rawMasterKey, 'sym', true)),
		'Failed to import master key',
	)

	const saved = await savedCredentials.setAndWait(Promise.resolve({ accessToken, masterKey }))

	if (!saved) {
		error.value = 'An error occurred while saving the credentials locally'
	} else {
		location.pathname = '/'
	}
}
</script>

<template>
	<form @submit="e => e.preventDefault()">
		<ErrorMessage v-if="error" :message="error" />

		<input type="text" v-model="username" placeholder="Username" autocomplete='username' required />
		<input type="text" v-model="password" placeholder="Password" autocomplete='current-password' required />

		<input type="submit" @click="login" />
	</form>
</template>
