<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'

const route = useRoute()
const isMobileMenuOpen = ref(false)
const { categoryTabs: menuItems } = useCategoryNavigation()

function isActiveMenu(label) {
  const key = String(label || '').toLowerCase()
  const path = route.path
  if (path === `/${key}` || path.startsWith(`/${key}/`)) return true
  return path === `/category/${key}`
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false
  },
)
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="logo">
      <img
        src="/assets/images/logo1.png"
        alt="SUSANG RENTAL HOUSE"
        class="logo-image"
      />
    </RouterLink>
    <button
      type="button"
      class="mobile-menu-toggle"
      :aria-expanded="isMobileMenuOpen"
      aria-controls="site-menu"
      aria-label="메뉴 열기"
      @click="toggleMobileMenu"
    >
      <span />
      <span />
      <span />
    </button>
    <nav id="site-menu" class="menu" :class="{ 'mobile-open': isMobileMenuOpen }">
      <RouterLink
        v-for="item in menuItems"
        :key="item.label"
        :to="item.to"
        class="menu-item"
        :class="{ active: isActiveMenu(item.label) }"
        @click="closeMobileMenu"
      >
        {{ item.label }}
      </RouterLink>
      <RouterLink to="/guide" class="menu-item" :class="{ active: route.path === '/guide' }" @click="closeMobileMenu">이용안내</RouterLink>
      <RouterLink to="/discount" class="menu-item" :class="{ active: route.path === '/discount' }" @click="closeMobileMenu">할인정보</RouterLink>
    </nav>
  </header>
</template>
