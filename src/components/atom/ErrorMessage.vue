<script setup lang="ts">
const props = defineProps<{
	message: string | null,
	inline?: boolean
}>()
</script>

<template>
	<div :class="{ inline: props.inline }">
		<p>{{ message }}</p>
	</div>
</template>

<style scoped>
.inline {
	display: inline-block;
}

p {
	color: red;
	border: 1px solid red;
	padding: 1rem;
	display: inline-block;
}
</style>