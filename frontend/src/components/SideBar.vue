<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import {
  BIconHouseFill, BIconMoonFill, BIconSunFill,
} from 'bootstrap-icons-vue'

const emits = defineEmits(['select'])

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div class="sidebar-container">
    <el-menu
      :router="true"
      @select="emits('select')"
    >
      <el-menu-item index="/">
        <el-icon><b-icon-house-fill /></el-icon>
        <span>ホーム</span>
      </el-menu-item>
    </el-menu>

    <div class="appearance-switch-container sidebar-button-container">
      <el-text>
        外観:
      </el-text>
      <el-switch
        :model-value="isDark"
        :active-icon="BIconMoonFill"
        :inactive-icon="BIconSunFill"
        class="color-mode-switch"
        @change="toggleDark()"
      />
    </div>
  </div>
</template>

<style>
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-container .el-menu {
  flex: 1;
}

.el-menu-item {
  user-select: none;
}

.sidebar-container .sidebar-button-container {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  height: 40px;
  user-select: none;
}

.sidebar-container .sidebar-button-container .el-text {
    white-space: nowrap;
    overflow-x: hidden;
}

.sidebar-container .appearance-switch-container {
  gap: 10px
}
</style>
