<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { lensProducts } from '../data/lensData'
const SUPPORT_SECTIONS = new Set(['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'])
const fallbackLensProducts = lensProducts.filter((item) => !SUPPORT_SECTIONS.has(item.section))

import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import { sortLensListProducts } from '../utils/categoryListOrder.js'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import FadeInImg from '../components/FadeInImg.vue'

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

const { products: lensItems } = useCategoryProducts('lens', fallbackLensProducts, { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const lensSubCategoryTabs = ['ALL', 'Prime Lens', 'Zoom Lens', 'E Mount', 'RF Mount', 'Adapter']

const sortedLensItems = computed(() => sortLensListProducts(lensItems.value, 'ALL'))

function mapLensSectionToSubCategory(sectionRaw, nameRaw) {
  const section = String(sectionRaw || '').toUpperCase()
  const name = String(nameRaw || '').toUpperCase()

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

function getLensSubCategories(item) {
  const sectionCandidates = [item?.section, ...(Array.isArray(item?.subSections) ? item.subSections : [])]
  return [
    ...new Set(
      sectionCandidates
        .map((section) => mapLensSectionToSubCategory(section, item?.name))
        .filter(Boolean),
    ),
  ]
}

function isLensVisible(item) {
  return activeSubCategory.value === 'ALL' || getLensSubCategories(item).includes(activeSubCategory.value)
}

function listPrice(item) {
  const orig = Number(item?.originalPrice || 0)
  if (orig > 0) return orig
  return Number(item?.discountPrice || 0)
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
        <RouterLink
          v-for="item in sortedLensItems"
          :key="item.id"
          v-show="isLensVisible(item)"
          :to="`/lens/${item.id}`"
          class="camera-card"
        >
          <div class="camera-thumb-wrap">
            <FadeInImg :src="item.thumbnail || item.image" :alt="item.name" img-class="camera-thumb" />
          </div>
          <div class="camera-meta">
            <span>{{ item.brand }}</span>
            <strong>{{ item.name }}</strong>
            <b>{{ item.priceDisplayText || formatCurrency(getDisplayHeadlinePrice(item)) }}</b>
          </div>
        </RouterLink>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>
