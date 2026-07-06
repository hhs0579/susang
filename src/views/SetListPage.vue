<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { setProducts } from '../data/setData'
import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { productDetailPath } from '../utils/productSlug'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import { useSetSubCategoryTabs, resolveSetListSections } from '../composables/useSetCameraSectionTabs.js'
import { sortSetListProducts } from '../utils/categoryListOrder.js'
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
  return label === 'SET'
}

const { products: setItems } = useCategoryProducts('set', setProducts, { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const subCategoryTabs = useSetSubCategoryTabs(setItems)

const sortedSetItems = computed(() => sortSetListProducts(setItems.value))

function isSetVisible(item) {
  return activeSubCategory.value === 'ALL' || resolveSetListSections(item).includes(activeSubCategory.value)
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>SET</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'SET' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
      <div class="camera-brand-tabs">
        <button
          v-for="sub in subCategoryTabs"
          :key="sub"
          type="button"
          class="camera-brand-button"
          :class="{ active: activeSubCategory === sub }"
          @click="activeSubCategory = sub"
        >
          {{ sub }}
        </button>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid">
        <RouterLink
          v-for="item in sortedSetItems"
          :key="item.id"
          v-show="isSetVisible(item)"
          :to="productDetailPath('set', item)"
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
