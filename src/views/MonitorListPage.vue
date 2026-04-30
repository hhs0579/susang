<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { monitorProducts } from '../data/monitorData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const menuItems = [
  { label: 'SET', to: '/set' },
  { label: 'CAMERA', to: '/camera' },
  { label: 'LENS', to: '/lens' },
  { label: 'GRIP', to: '/grip' },
  { label: 'MONITOR', to: '/monitor' },
  { label: 'LIGHT', to: '/light' },
  { label: 'INTERCOM', to: '/intercom' },
]

function isActiveMenu(label) {
  return label === 'MONITOR'
}

const { products: monitorItems } = useCategoryProducts('monitor', monitorProducts)
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const monitorSubCategoryTabs = [
  'ALL',
  'Wireless Transceiver',
  "5' 7' Monitor",
  'Director Monitor',
  'Monitor Acc',
]

const filteredMonitorItems = computed(() => {
  if (activeSubCategory.value === 'ALL') return monitorItems.value
  return monitorItems.value.filter((item) => getMonitorSubCategory(item) === activeSubCategory.value)
})

function getMonitorSubCategory(item) {
  const section = String(item?.section || '').toUpperCase()
  if (section === 'WIRELESS TRANSCEIVER' || section === 'WIRELESS MONITOR') {
    return 'Wireless Transceiver'
  }
  if (section === "5' 7' MONITOR" || section === "5'7' MONITOR") {
    return "5' 7' Monitor"
  }
  if (section === 'DIRECTOR MONITOR') return 'Director Monitor'
  if (section === 'MONITOR ACC') return 'Monitor Acc'
  // Backward compatibility fallback for legacy values.
  if (section.includes('WIRELESS')) return 'Wireless Transceiver'
  if (section.includes("5'7'") || section.includes("5' 7'")) return "5' 7' Monitor"
  if (section.includes('DIRECTOR')) return 'Director Monitor'
  if (section.includes('ACC')) return 'Monitor Acc'
  return 'Monitor Acc'
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>MONITOR / WIRELESS</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'MONITOR' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in monitorSubCategoryTabs"
          :key="subCategory"
          type="button"
          class="camera-brand-button"
          :class="{ active: activeSubCategory === subCategory }"
          @click="activeSubCategory = subCategory"
        >
          {{ subCategory }}
        </button>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid lens-grid">
        <RouterLink v-for="item in filteredMonitorItems" :key="item.id" :to="`/monitor/${item.id}`" class="camera-card">
          <div class="camera-thumb-wrap">
            <img :src="item.image" :alt="item.name" class="camera-thumb" />
          </div>
          <div class="camera-meta">
            <span>{{ item.brand }}</span>
            <strong>{{ item.name }}</strong>
            <b>{{ formatCurrency(item.discountPrice) }}</b>
          </div>
        </RouterLink>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>
