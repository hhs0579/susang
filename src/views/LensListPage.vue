<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { lensProducts } from '../data/lensData'
const SUPPORT_SECTIONS = new Set(['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'])
const fallbackLensProducts = lensProducts.filter((item) => !SUPPORT_SECTIONS.has(item.section))

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
  return label === 'LENS'
}

const { products: lensItems } = useCategoryProducts('lens', fallbackLensProducts)
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const lensSubCategoryTabs = ['ALL', 'Prime Lens', 'Zoom Lens', 'E Mount', 'RF Mount', 'Adapter']

const filteredLensItems = computed(() => {
  if (activeSubCategory.value === 'ALL') return lensItems.value
  return lensItems.value.filter((item) => getLensSubCategory(item) === activeSubCategory.value)
})

function getLensSubCategory(item) {
  const section = String(item?.section || '').toUpperCase()
  const name = String(item?.name || '').toUpperCase()

  if (section === 'PRIME LENS') return 'Prime Lens'
  if (section === 'ZOOM LENS') return 'Zoom Lens'
  if (section === 'E MOUNT') return 'E Mount'
  if (section === 'RF MOUNT') return 'RF Mount'
  if (section === 'ADAPTER' || section === 'ACC') return 'Adapter'

  // Backward compatibility fallback for legacy data.
  if (name.includes('ADAPTER')) return 'Adapter'
  if (name.includes('ZOOM')) return 'Zoom Lens'
  if (name.includes('RF')) return 'RF Mount'
  if (name.includes('FE ') || name.includes('E MOUNT') || name.includes(' E ') || name.endsWith(' E')) return 'E Mount'
  return 'Prime Lens'
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>LENS / MATTE</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'LENS' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in lensSubCategoryTabs"
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
        <RouterLink v-for="item in filteredLensItems" :key="item.id" :to="`/lens/${item.id}`" class="camera-card">
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
