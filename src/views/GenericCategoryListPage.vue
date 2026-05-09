<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import FadeInImg from '../components/FadeInImg.vue'

const route = useRoute()
const { categoryTabs } = useCategoryNavigation()
const categoryKey = computed(() => String(route.params.slug || '').trim().toLowerCase())
const categoryTitle = computed(() => categoryKey.value.toUpperCase())

const { products: categoryItems } = useCategoryProducts(categoryKey.value, [], { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const subCategoryTabs = computed(() => {
  const sections = new Set(
    categoryItems.value.map((item) => String(item.section || '').trim()).filter(Boolean),
  )
  return ['ALL', ...Array.from(sections).sort((a, b) => a.localeCompare(b))]
})

const sortedItems = computed(() => categoryItems.value)

function isVisibleItem(item) {
  if (activeSubCategory.value === 'ALL') return true
  return String(item.section || '').trim() === activeSubCategory.value
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>{{ categoryTitle }}</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === categoryTitle }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="subCategory in subCategoryTabs"
          :key="subCategory"
          type="button"
          class="camera-brand-button"
          :class="{ active: activeSubCategory === subCategory }"
          @click="activeSubCategory = subCategory"
        >
          {{ subCategory === 'ALL' ? 'ALL' : subCategory }}
        </button>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid lens-grid">
        <RouterLink
          v-for="item in sortedItems"
          :key="item.id"
          v-show="isVisibleItem(item)"
          :to="`/${categoryKey}/${item.id}`"
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
