<script setup lang="ts">
import type { inferProcedureOutput } from '@trpc/server'
import type { AppRouter } from '../../server'
import Decrypt from '../atom/Decrypt.vue';
import MessagesList from '../organisms/MessagesList.vue';
import WriteMessage from '../organisms/WriteMessage.vue';
import CorrespondentsList from '../organisms/CorrespondentsList.vue';
import PendingFilledCorrespondenceRequests from '../organisms/PendingFilledCorrespondenceRequests.vue';
import PendingFullyFilledCorrespondenceRequests from '../organisms/PendingFullyFilledCorrespondenceRequests.vue';
import CorrespondenceCodeInput from '../organisms/CorrespondenceCodeInput.vue';
import CorrespondenceCodeGenerator from '../organisms/CorrespondenceCodeGenerator.vue';
import type { User } from '@prisma/client';

export interface Props {
    viewer: User
    messages: inferProcedureOutput<AppRouter['messages']['list']>,
    correspondents: inferProcedureOutput<AppRouter['correspondents']['list']>,
    pendingFilledCorrespondenceRequests:
    inferProcedureOutput<AppRouter['correspondenceRequest']['individuals']['pendingFilledRequests']>,
    pendingFullyFilledCorrespondenceRequests:
    inferProcedureOutput<AppRouter['correspondenceRequest']['individuals']['pendingFullyFilledRequests']>,
}

const props = defineProps<Props>()
</script>

<template>
    <h2>
        <Decrypt :data="viewer.displayNameMK" :iv="viewer.displayNameMKIV" :decrypt="{ with: 'masterKey' }" />
    </h2>

    <div class="container">
        <h3>Messages list</h3>

        <MessagesList :messages="props.messages" />
    </div>

    <div class="container">
        <h3>Write a message</h3>

        <WriteMessage :correspondents="props.correspondents" />
    </div>

    <div class="container">
        <h3>Correspondents</h3>

        <CorrespondentsList :correspondents="props.correspondents" />

        <h3>On-hold correspondence requests</h3>

        <PendingFilledCorrespondenceRequests :displayNameMK="viewer.displayNameMK"
            :displayNameMKIV="viewer.displayNameMKIV" :encryptedRequests="props.pendingFilledCorrespondenceRequests" />

        <h3>Fully-filled correspondence requests</h3>

        <PendingFullyFilledCorrespondenceRequests :encryptedRequests="props.pendingFullyFilledCorrespondenceRequests" />

        <br />

        <div class="container">
            <CorrespondenceCodeGenerator />
        </div>

        <div class="container">
            <CorrespondenceCodeInput :displayNameMK="viewer.displayNameMK" :displayNameMKIV="viewer.displayNameMKIV" />
        </div>
    </div>
</template>

<style scoped>
.container {
    border: 1px solid black;
    padding: 1rem;
}
</style>
