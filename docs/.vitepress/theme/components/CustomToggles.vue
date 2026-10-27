<script setup lang="ts">
import { useData, useRoute, useRouter } from 'vitepress'
import { computed } from 'vue'

const { isDark, site, lang } = useData()
const route = useRoute()
const router = useRouter()

const toggleDark = () => {
  isDark.value = !isDark.value
}

const toggleLang = () => {
  const base = site.value.base
  const path = '/' + route.path.slice(base.length)
  if (path.startsWith('/en/')) {
    router.go(base + path.replace(/^\/en\//, ''))
  } else {
    router.go(`${base}en${path}`)
  }
}

const isEn = computed(() => lang.value.startsWith('en'))
</script>

<template>
  <div class="custom-toggles">
    <button class="toggle-btn lang-btn" @click="toggleLang" :title="isEn ? '切换到中文' : 'Switch to English'">
      {{ isEn ? '中' : 'En' }}
    </button>
    <div class="divider"></div>
    <button class="toggle-btn dark-btn" @click="toggleDark" :title="isEn ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : (isDark ? '切换到浅色模式' : '切换到深色模式')">
      <span v-if="isDark" class="icon-moon">🌙</span>
      <span v-else class="icon-sun">☀️</span>
    </button>
  </div>
</template>

<style scoped>
.custom-toggles {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 桌面端导航栏样式 */
:global(.VPNavBar .custom-toggles) {
  margin-left: 16px;
}

/* 移动端菜单栏样式 */
:global(.VPNavScreen .custom-toggles) {
  margin-top: 16px;
  padding: 12px 16px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  justify-content: space-between;
}

:global(.VPNavScreen .divider) {
  display: none;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--vp-c-divider);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-1);
  transition: color 0.25s;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
}

:global(.VPNavScreen .toggle-btn) {
  flex: 1;
  padding: 8px 0;
  background-color: var(--vp-c-bg);
  border-radius: 6px;
  border: 1px solid var(--vp-c-border);
}

:global(.VPNavScreen .toggle-btn:first-child) {
  margin-right: 12px;
}

.toggle-btn:hover {
  color: var(--vp-c-brand-1);
}

:global(.VPNavScreen .toggle-btn:hover) {
  border-color: var(--vp-c-brand-1);
}

.lang-btn {
  width: 24px;
  height: 24px;
}

:global(.VPNavScreen .lang-btn) {
  width: auto;
  height: auto;
}

.dark-btn {
  font-size: 16px;
}
</style>
