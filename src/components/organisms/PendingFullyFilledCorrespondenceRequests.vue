<script setup lang="ts">
import type { inferRouterOutputs } from '@trpc/server';
import { decryptTextSymFromTRPC, importKeyFromTRPC } from '../../common/crypto-trpc';
import { expectOk } from '../../common/utils';
import type { AppRouter } from '../../server';
import { expectMasterKey } from '../../state';
import { trpc } from '../../trpc-client';
import { onMounted, ref } from 'vue';
import ErrorMessage from '../atom/ErrorMessage.vue';

type EncryptedRequests =
    inferRouterOutputs<AppRouter>['correspondenceRequest']['individuals']['pendingFullyFilledRequests']

const props = defineProps<{
    encryptedRequests: EncryptedRequests
}>()

type EncryptedRequest = EncryptedRequests[number]

type RequestEntry = {
    req: EncryptedRequest
    initiatorDisplayName: string
    correspondenceKey: CryptoKey
}

async function fetch(reload: boolean) {
    const requests = reload ? await trpc.correspondenceRequest.individuals.pendingFullyFilledRequests.query() : props.encryptedRequests

    // TODO: actual refetch
    return Promise.allSettled(
        requests.map(async (req): Promise<RequestEntry> => {
            const masterKey = await expectMasterKey()

            const correspondenceKeyJWK = expectOk(
                await decryptTextSymFromTRPC(req.from.correspondenceKeyMK, req.from.correspondenceKeyMKIV, masterKey),
            )

            const correspondenceKey = expectOk(await importKeyFromTRPC(correspondenceKeyJWK, 'sym', true))

            const initiatorDisplayName = expectOk(
                await decryptTextSymFromTRPC(req.initiatorDisplayNameCK, req.initiatorDisplayNameCKIV, correspondenceKey),
            )

            return { initiatorDisplayName, req, correspondenceKey }
        })
    )
}

async function answerRequest(req: EncryptedRequest) {
    try {
        await trpc.correspondenceRequest.individuals.markAcceptedRequest.mutate({
            correspondenceInitID: req.from.correspondenceInitID,
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
                <th>Name</th>
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
                    <td>{{ request.value.initiatorDisplayName }}</td>
                    <td>
                        <button @click="() => answerRequest(request.value.req)">Confirm</button>
                    </td>
                </template>
            </tr>
        </tbody>
    </table>
</template>