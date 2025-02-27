<script setup lang="ts">
import { ref } from 'vue'

import { client } from '@/repositories/client'

const message = ref('')

const onClickLoad = async () => {
  const response = await client.index.$get()
  if (response.ok) {
    message.value = (await response.json()).message
  }
  else {
    message.value = 'Failed to load'
  }
}
</script>

<template>
  <h2>root page</h2>
  <el-row>
    <el-button @click="onClickLoad">
      Load...
    </el-button>
  </el-row>
  <el-row justify="center">
    {{ message }}
  </el-row>
</template>
