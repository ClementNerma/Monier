<script setup lang="ts">
import { ref } from 'vue';
import { serializeBuffer } from '../../common/base64';
import { hash, generateSalt, deriveKeyFromPassword, generateRandomBuffer, generateSymmetricKey, exportKey } from '../../common/crypto';
import { encryptSymForTRPC } from '../../common/crypto-trpc';
import { expectOk, textToBuffer } from '../../common/utils';
import { trpc } from '../../trpc-client';

const username = ref('')
const displayName = ref('')
const password = ref('')

async function register() {
    const usernameHash = await hash(expectOk(textToBuffer(username.value)))

    const passwordSalt = generateSalt()
    const passwordKey = await deriveKeyFromPassword(expectOk(textToBuffer(password.value)), passwordSalt)

    const passwordProofPlainText = generateRandomBuffer(32)

    const masterKey = await generateSymmetricKey()

    await trpc.users.register.mutate({
        usernameHash,
        passwordSalt: serializeBuffer(passwordSalt),
        passwordProofPlainText: serializeBuffer(passwordProofPlainText),
        passwordProofPK: await encryptSymForTRPC(passwordProofPlainText, passwordKey),
        masterKeyPK: await encryptSymForTRPC(expectOk(textToBuffer(await exportKey(masterKey))), passwordKey),
        displayNameMK: await encryptSymForTRPC(expectOk(textToBuffer(displayName.value)), masterKey),
    })

    location.pathname = '/login'
}
</script>

<template>
    <form @submit="e => e.preventDefault()">
        <input type="text" v-model="username" placeholder="Username" autocomplete='username' required />
        <input type="text" v-model="displayName" placeholder="Display name" autocomplete='name' required />
        <input type="password" v-model="password" placeholder="Password" autocomplete='new-password' required />

        <input type="submit" value="Submit" @click="register" />
    </form>
</template>