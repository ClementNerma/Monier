<script setup lang="ts">
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from '../../server';
import Decrypt from '../atom/Decrypt.vue';
import { ref } from 'vue';
import { trpc } from '../../trpc-client';
import { pickEncrypted } from '../../common/domain-utils';

export interface Props {
    messages: inferProcedureOutput<AppRouter['messages']['list']>
}

const props = defineProps<Props>()

const messages = ref(props.messages.items)
let nextPageCursor = ref(props.messages.nextPageCursor)

async function loadMore() {
    if (!nextPageCursor.value) {
        return alert('Internal error: next page cursor is null')
    }

    const res = await trpc.messages.list.query({
        pagination: {
            cursor: nextPageCursor.value,
            order: 'desc',
            limit: 10, // TODO: configurable
        },
        filters: {
            unreadOnly: true
        }
    })

    messages.value.push(...res.items)
    nextPageCursor.value = res.nextPageCursor
}

</script>

<template>
    <table>
        <thead>
            <tr>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Category</th>
                <th>Title</th>
                <th>Date & time</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="message in messages.items">
                <td>
                    <em v-if="message.isSender">You</em>
                    <Decrypt v-else :data="pickEncrypted(message.exchange.correspondent, 'displayNameCK')"
                        :decrypt="{ with: 'jwkMK', content: pickEncrypted(message.exchange.correspondent, 'correspondenceKeyMK') }" />
                </td>
                <td>
                    <Decrypt v-if="message.isSender"
                        :data="pickEncrypted(message.exchange.correspondent, 'displayNameCK')"
                        :decrypt="{ with: 'jwkMK', content: pickEncrypted(message.exchange.correspondent, 'correspondenceKeyMK') }" />
                    <em v-else>You</em>
                </td>
                <td>
                    <Decrypt :data="pickEncrypted(message, 'categoryCK')"
                        :decrypt="{ with: 'jwkMK', content: pickEncrypted(message.exchange.correspondent, 'correspondenceKeyMK') }" />
                </td>
                <td>
                    <strong v-if="message.isImportant">[IMPORTANT]</strong>
                    <Decrypt :data="pickEncrypted(message, 'titleCK')"
                        :decrypt="{ with: 'jwkMK', content: pickEncrypted(message.exchange.correspondent, 'correspondenceKeyMK') }" />
                </td>
                <td>{{ message.createdAt.toLocaleString() }}</td>
            </tr>

            <tr v-if="nextPageCursor">
                <td colspan="5"><button @click="loadMore">Load more</button></td>
            </tr>
        </tbody>
    </table>
</template>