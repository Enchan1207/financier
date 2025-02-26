<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { client } from './repositories/client'

const message = ref('')

onMounted(async () => {
  const response = await client.index.$get({})
  message.value = (await response.json()).message
})

</script>

<template>
  <h2>Financier</h2>
  <p>{{ message }}</p>
</template>
