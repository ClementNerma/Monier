<script setup lang="ts">
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from '../../server';
import { ref } from 'vue';
import Decrypt from '../atom/Decrypt.vue';
import ErrorMessage from '../atom/ErrorMessage.vue';
import { trpc } from '../../trpc-client';
import { decryptTextSymFromTRPC, encryptTextSymForTRPC, importKeyFromTRPC } from '../../common/crypto-trpc';
import { expectOk } from '../../common/utils';
import { expectMasterKey } from '../../state';

export interface Props {
    correspondents: inferProcedureOutput<AppRouter['correspondents']['list']>
}

const { correspondents } = defineProps<Props>()

async function send() {
    if (!correspondentId.value) {
        return alert('Please select a correspondent in the list')
    }

    const correspondent = correspondents.find(c => c.id === correspondentId.value)

    if (!correspondent) {
        return alert('Internal error: correspondent not found')
    }

    error.value = ''
    status.value = 'Encrypting data...'

    const masterKey = await expectMasterKey()

    const correspondenceKeyJWK = expectOk(await decryptTextSymFromTRPC(correspondent.correspondenceKeyMK, correspondent.correspondenceKeyMKIV, masterKey))
    const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym'))

    status.value = 'Sending data...'

    try {
        await trpc.messages.send.mutate({
            correspondentId: correspondentId.value,
            exchangeId: null,
            message: {
                isImportant: isImportant.value,
                categoryCK: await encryptTextSymForTRPC('', correspondenceKey), // TODO
                titleCK: await encryptTextSymForTRPC(subject.value, correspondenceKey),
                bodyCK: await encryptTextSymForTRPC(body.value, correspondenceKey)
            }
        })
    } catch (e) {
        status.value = ''
        error.value = e instanceof Error ? e.message : '<unknown error>'
    }

    status.value = 'Sent!'

    isImportant.value = false
    correspondentId.value = ''
    subject.value = ''
    body.value = ''
}

let status = ref('')
let error = ref('')

let isImportant = ref(false)
let correspondentId = ref('')
let subject = ref('')
let body = ref('')
</script>

<template>
    <form @submit="e => e.preventDefault()">
        <div>
            <label><strong>To: </strong></label>
            <select v-model="correspondentId" required>
                <option disabled value="">Please select a correspondent</option>
                <option v-for="correspondent in correspondents" :value="correspondent.id">
                    <Decrypt :data="correspondent.displayNameCK" :iv="correspondent.displayNameCKIV"
                        :decrypt="{ with: 'jwkMK', content: correspondent.correspondenceKeyMK, iv: correspondent.correspondenceKeyMKIV }" />
                </option>
            </select>
        </div>

        <div>
            <input type="checkbox" v-model="isImportant" />
            <label>Important?</label>
        </div>

        <p><strong>Subject</strong></p>

        <div>
            <input type="text" v-model="subject" required />
        </div>

        <p><strong>Message body</strong></p>

        <textarea v-model="body" />

        <div>
            <input type="submit" value="Send" @click="send" />
        </div>

        <p v-if="status">{{ status }}</p>
        <ErrorMessage v-if="error" :message="error" inline />
    </form>
</template>