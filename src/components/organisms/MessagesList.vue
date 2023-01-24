<script setup lang="ts">
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from '../../server';
import Decrypt from '../atom/Decrypt.vue';

export interface Props {
    messages: inferProcedureOutput<AppRouter['messages']['list']>
}

const props = defineProps<Props>()
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
            <tr v-for="message in props.messages">
                <td>
                    <em v-if="message.isSender">You</em>
                    <Decrypt v-else :data="message.exchange.correspondent.displayNameCK"
                        :iv="message.exchange.correspondent.displayNameCKIV"
                        :decrypt="{ with: 'jwkMK', content: message.exchange.correspondent.correspondenceKeyMK, iv: message.exchange.correspondent.correspondenceKeyMKIV }" />
                </td>
                <td>
                    <Decrypt v-if="message.isSender" :data="message.exchange.correspondent.displayNameCK"
                        :iv="message.exchange.correspondent.displayNameCKIV"
                        :decrypt="{ with: 'jwkMK', content: message.exchange.correspondent.correspondenceKeyMK, iv: message.exchange.correspondent.correspondenceKeyMKIV }" />
                    <em v-else>You</em>
                </td>
                <td>
                    <Decrypt :data="message.categoryCK" :iv="message.categoryCKIV"
                        :decrypt="{ with: 'jwkMK', content: message.exchange.correspondent.correspondenceKeyMK, iv: message.exchange.correspondent.correspondenceKeyMKIV }" />
                </td>
                <td>
                    <strong v-if="message.isImportant">[IMPORTANT]</strong>
                    <Decrypt :data="message.titleCK" :iv="message.titleCKIV"
                        :decrypt="{ with: 'jwkMK', content: message.exchange.correspondent.correspondenceKeyMK, iv: message.exchange.correspondent.correspondenceKeyMKIV }" />
                </td>
                <td>{{ message.createdAt.toLocaleString() }}</td>
            </tr>
        </tbody>
    </table>
</template>