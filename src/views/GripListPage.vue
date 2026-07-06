<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { gripProducts } from '../data/gripData'
import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { productDetailPath } from '../utils/productSlug'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import { sortGripListProducts } from '../utils/categoryListOrder.js'
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
  return label === 'GRIP'
}

const { products: gripItems } = useCategoryProducts('grip', gripProducts, { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const gripSubCategoryTabs = ['ALL', 'Gimbal', 'Grip', 'Tripod', 'Cart']

const sortedGripItems = computed(() => sortGripListProducts(gripItems.value, 'ALL'))

function mapGripSectionToSubCategory(sectionRaw, nameRaw) {
  const section = String(sectionRaw || '').toUpperCase()
  const name = String(nameRaw || '').toUpperCase()

  if (section.includes('TRIPOD')) return 'Tripod'
  if (section.includes('CART')) return 'Cart'
  if (section === 'GIMBAL') return 'Gimbal'
  if (section === 'GRIP') return 'Grip'
  if (section === 'GRIP / GIMBAL') {
    if (
      name.includes('RONIN') ||
      name.includes('MOVI') ||
      name.includes('GIMBAL') ||
      name.includes('EASYRIG') ||
      name.includes('SEGWAY')
    ) {
      return 'Gimbal'
    }
    return 'Grip'
  }
  if (
    name.includes('RONIN') ||
    name.includes('MOVI') ||
    name.includes('GIMBAL') ||
    name.includes('EASYRIG') ||
    name.includes('SEGWAY')
  ) {
    return 'Gimbal'
  }
  return 'Grip'
}

function getGripSubCategories(item) {
  const sectionCandidates = [item?.section, ...(Array.isArray(item?.subSections) ? item.subSections : [])]
  return [...new Set(sectionCandidates.map((s) => mapGripSectionToSubCategory(s, item?.name)).filter(Boolean))]
}

function isGripVisible(item) {
  return activeSubCategory.value === 'ALL' || getGripSubCategories(item).includes(activeSubCategory.value)
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>GRIP / GIMBAL</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'GRIP' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in gripSubCategoryTabs"
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
          v-for="item in sortedGripItems"
          :key="item.id"
          v-show="isGripVisible(item)"
          :to="productDetailPath('grip', item)"
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
