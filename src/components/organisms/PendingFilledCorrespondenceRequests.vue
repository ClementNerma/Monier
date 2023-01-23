<script setup lang="ts">
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '../../server';
import { decryptTextSymFromTRPC, importKeyFromTRPC, decryptTextAsymFromTRPC, encryptTextSymForTRPC } from '../../common/crypto-trpc';
import { expectOk } from '../../common/utils';
import { expectMasterKey } from '../../state';
import { onMounted, ref } from 'vue';
import { exportKey } from '../../common/crypto';
import { trpc } from '../../trpc-client';
import ErrorMessage from '../atom/ErrorMessage.vue';

type EncryptedRequests = inferRouterOutputs<AppRouter>['correspondenceRequest']['individuals']['pendingFilledRequests']

const props = defineProps<{
    encryptedRequests: EncryptedRequests
    displayNameMK: string
    displayNameMKIV: string
}>()

type RequestEntry = {
    req: EncryptedRequests[number]
    targetDisplayName: string
    correspondenceKey: CryptoKey
}

async function fetch(reload: boolean) {
    const requests: EncryptedRequests = reload ? await trpc.correspondenceRequest.individuals.pendingFilledRequests.query() : props.encryptedRequests

    return Promise.allSettled(
        requests.map(async (req): Promise<RequestEntry> => {
            const masterKey = await expectMasterKey()

            const correspondenceInitPrivateKeyJWK = expectOk(
                await decryptTextSymFromTRPC(
                    req.from.correspondenceInitPrivateKeyMK,
                    req.from.correspondenceInitPrivateKeyMKIV,
                    masterKey,
                ),
            )

            const correspondenceInitPrivateKey = expectOk(
                await importKeyFromTRPC(correspondenceInitPrivateKeyJWK, 'asymPriv'),
            )

            const correspondenceKeyJWK = expectOk(
                await decryptTextAsymFromTRPC(req.correspondenceKeyCIPK, correspondenceInitPrivateKey),
            )

            const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym', true))

            const targetDisplayName = expectOk(
                await decryptTextSymFromTRPC(req.targetDisplayNameCK, req.targetDisplayNameCKIV, correspondenceKey),
            )

            return { targetDisplayName, req, correspondenceKey }
        }),
    )
}

async function answerRequest({ req, correspondenceKey }: RequestEntry) {
    const masterKey = await expectMasterKey()

    const displayName = await decryptTextSymFromTRPC(props.displayNameMK, props.displayNameMKIV, masterKey)

    if (displayName instanceof Error) {
        return alert(`Failed to decrypt current user's display name: ${displayName.message}`)
    }

    try {
        await trpc.correspondenceRequest.individuals.answerFilledRequest.mutate({
            correspondenceInitID: req.from.correspondenceInitID,
            correspondenceKeyMK: await encryptTextSymForTRPC(await exportKey(correspondenceKey), masterKey),
            initiatorDisplayNameCK: await encryptTextSymForTRPC(displayName, correspondenceKey),
        })
    } catch (e) {
        return alert(`Failed to confirm: ${e instanceof Error ? e.message : '<unknown error>'}`)
    }

    alert('Success!')

    requests.value = await fetch(true)
}

const requests = ref<PromiseSettledResult<RequestEntry>[] | null>(null)

onMounted(async () => {
    requests.value = await fetch(false)
})
</script>

<template>
    <table>
        <thead>
            <tr>
                <th>Nom</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <tr v-if="requests === null">
                <td colspan="2">
                    <em>Loading...</em>
                </td>
            </tr>

            <tr v-for="request in requests">
                <td v-if="request.status === 'rejected'" colspan="2" style="text-align: center;">
                    <ErrorMessage :message="request.reason.message" inline />
                </td>

                <template v-else>
                    <td>{{ request.value.targetDisplayName }}</td>
                    <td><button @click="() => answerRequest(request.value)">Confirm</button></td>
                </template>
            </tr>
        </tbody>
    </table>
</template>