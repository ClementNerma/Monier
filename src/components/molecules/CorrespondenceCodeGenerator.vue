<script setup lang="ts">
import { ref } from 'vue';
import { generateAsymmetricKeyPair, exportKey } from '../../common/crypto';
import { encryptTextSymForTRPC } from '../../common/crypto-trpc';
import { expectMasterKey } from '../../state';
import { trpc } from '../../trpc-client';

const result = ref('')

async function generate() {
	result.value = 'Loading...'

	const { publicKey, privateKey } = await generateAsymmetricKeyPair()

	const { correspondenceCode } = await trpc.correspondenceRequest.individuals.generateCode.mutate({
		correspondenceInitPublicKeyJWK: await exportKey(publicKey),
		correspondenceInitPrivateKeyMK: await encryptTextSymForTRPC(await exportKey(privateKey), await expectMasterKey()),
	})

	result.value = correspondenceCode
}
</script>

<template>
	<button @click="generate">Generate a correspondence code</button>

	<p v-if="result">{{ result }}</p>
</template>