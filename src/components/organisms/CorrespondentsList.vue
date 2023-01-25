<script setup lang="ts">
import type { inferProcedureOutput } from '@trpc/server';
import type { AppRouter } from '../../server';
import Decrypt from '../atom/Decrypt.vue';
import { pickEncrypted } from '../../common/domain-utils';

export interface Props {
    correspondents: inferProcedureOutput<AppRouter['correspondents']['list']>
}

const props = defineProps<Props>()
</script>

<template>
    <table>
        <thead>
            <tr>
                <th>Nom</th>
                <th>Service ?</th>
                <th>Initiateur ?</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="corr in props.correspondents">
                <td>
                    <Decrypt :data="pickEncrypted(corr, 'displayNameCK')"
                        :decrypt="{ with: 'jwkMK', content: pickEncrypted(corr, 'correspondenceKeyMK') }" />
                </td>
                <td>{{ corr.isService ? "Yes" : "No" }}</td>
                <td>{{ corr.isInitiator ? "Yes" : "No" }}</td>
            </tr>
        </tbody>
    </table>
</template>