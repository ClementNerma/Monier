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
}>()

type RequestEntry = {
    req: EncryptedRequests[number]
    displayName: string
    correspondenceKey: CryptoKey
}

function fetch() {
    // TODO: actual refetch

    return Promise.allSettled(
        props.encryptedRequests.map(async (req): Promise<RequestEntry> => {
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

            const displayName = expectOk(
                await decryptTextSymFromTRPC(req.userDisplayNameCK, req.userDisplayNameCKIV, correspondenceKey),
            )

            return { displayName, req, correspondenceKey }
        }),
    )
}

async function answerRequest({ displayName, req, correspondenceKey }: RequestEntry) {
    const masterKey = await expectMasterKey()

    await trpc.correspondenceRequest.individuals.answerFilledRequest.mutate({
        correspondenceInitID: req.from.correspondenceInitID,
        correspondenceKeyMK: await encryptTextSymForTRPC(await exportKey(correspondenceKey), masterKey),
        userDisplayNameCK: await encryptTextSymForTRPC(displayName, correspondenceKey),
    })

    alert('Success!')

    requests.value = await fetch()
}

const requests = ref<PromiseSettledResult<RequestEntry>[] | null>(null)

onMounted(async () => {
    requests.value = await fetch()
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
                    <td>{{ request.value.displayName }}</td>
                    <td><button @click="() => answerRequest(request.value)">Confirm</button></td>
                </template>
            </tr>
        </tbody>
    </table>
</template>