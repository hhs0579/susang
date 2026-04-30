<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { lightProducts } from '../data/lightData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const { products: lightItems } = useCategoryProducts('light', lightProducts)
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const lightSubCategoryTabs = [
  'ALL',
  'LED Panel',
  'LED Spot-Source',
  'LED Modifiers',
  'LED Like Practical',
  'Light Arm Set',
  'Light Grip',
  'Battery System',
  'Light Scrim',
]

const filteredLightItems = computed(() => {
  if (activeSubCategory.value === 'ALL') return lightItems.value
  return lightItems.value.filter((item) => getLightSubCategory(item) === activeSubCategory.value)
})

function getLightSubCategory(item) {
  const section = String(item?.section || '').toUpperCase()
  if (section.includes('LED PANEL')) return 'LED Panel'
  if (section.includes('LED SPOT-SOURCE')) return 'LED Spot-Source'
  if (section.includes('LED MODIFIERS')) return 'LED Modifiers'
  if (section.includes('LED LIKE PRACTICAL')) return 'LED Like Practical'
  if (section.includes('LIGHT ARM SET')) return 'Light Arm Set'
  if (section.includes('LIGHT GRIP')) return 'Light Grip'
  if (section.includes('BATTERY SYSTEM')) return 'Battery System'
  if (section.includes('LIGHT SCRIM')) return 'Light Scrim'
  return 'LED Panel'
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>LIGHT</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'LIGHT' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in lightSubCategoryTabs"
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
        <RouterLink v-for="item in filteredLightItems" :key="item.id" :to="`/light/${item.id}`" class="camera-card">
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
