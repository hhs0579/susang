<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { lensProducts } from '../data/lensData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const SUPPORT_SECTIONS = new Set(['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'])
const fallbackSupportProducts = lensProducts.filter((item) => SUPPORT_SECTIONS.has(item.section))

const { products: supportItems } = useCategoryProducts('support', fallbackSupportProducts)
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const supportSubCategoryTabs = ['ALL', 'Wireless Focus', 'MatteBox', 'Filter']

const filteredSupportItems = computed(() => {
  if (activeSubCategory.value === 'ALL') return supportItems.value
  return supportItems.value.filter((item) => getSupportSubCategory(item) === activeSubCategory.value)
})

function getSupportSubCategory(item) {
  const section = String(item?.section || '').toUpperCase()
  if (section.includes('WIRELESS')) return 'Wireless Focus'
  if (section.includes('MATTEBOX')) return 'MatteBox'
  if (section.includes('FILTER')) return 'Filter'
  return 'Filter'
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
        <RouterLink v-for="item in filteredSupportItems" :key="item.id" :to="`/support/${item.id}`" class="camera-card">
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
