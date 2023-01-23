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
        <tbody>
            <tr v-for="message in props.messages">
                <td>
                    <strong v-if="message.isImportant">[IMPORTANT]</strong>
                    <Decrypt :data="message.titleCK" :iv="message.titleCKIV"
                        :decrypt="{ with: 'jwkMK', content: message.exchange.correspondent.correspondenceKeyMK, iv: message.exchange.correspondent.correspondenceKeyMKIV }" />
                </td>
                <td>{{ message.createdAt }}</td>
            </tr>
        </tbody>
    </table>
</template>