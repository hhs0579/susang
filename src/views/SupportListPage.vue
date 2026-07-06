<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { lensProducts } from '../data/lensData'
import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { productDetailPath } from '../utils/productSlug'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import { sortSupportListProducts } from '../utils/categoryListOrder.js'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import FadeInImg from '../components/FadeInImg.vue'

const SUPPORT_SECTIONS = new Set(['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'])
const fallbackSupportProducts = lensProducts.filter((item) => SUPPORT_SECTIONS.has(item.section))

const { products: supportItems } = useCategoryProducts('support', fallbackSupportProducts, { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const supportSubCategoryTabs = ['ALL', 'Wireless Focus', 'MatteBox', 'Filter']

const sortedSupportItems = computed(() => sortSupportListProducts(supportItems.value))

function mapSupportSectionToSubCategory(sectionRaw) {
  const section = String(sectionRaw || '').toUpperCase()
  if (section.includes('WIRELESS')) return 'Wireless Focus'
  if (section.includes('MATTEBOX')) return 'MatteBox'
  if (section.includes('FILTER')) return 'Filter'
  return 'Filter'
}

function getSupportSubCategories(item) {
  const sectionCandidates = [item?.section, ...(Array.isArray(item?.subSections) ? item.subSections : [])]
  return [...new Set(sectionCandidates.map((s) => mapSupportSectionToSubCategory(s)).filter(Boolean))]
}

function isSupportVisible(item) {
  return activeSubCategory.value === 'ALL' || getSupportSubCategories(item).includes(activeSubCategory.value)
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>SUPPORT</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'SUPPORT' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in supportSubCategoryTabs"
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
          v-for="item in sortedSupportItems"
          :key="item.id"
          v-show="isSupportVisible(item)"
          :to="productDetailPath('support', item)"
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
