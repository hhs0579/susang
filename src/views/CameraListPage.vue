<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { cameraProducts } from '../data/cameraData'
import { formatCurrency, useCategoryProducts, getDisplayHeadlinePrice } from '../composables/useCategoryProducts'
import { useCategoryNavigation } from '../composables/useCategoryNavigation'
import { useCameraSubCategoryTabs, resolveCameraListSections } from '../composables/useSetCameraSectionTabs.js'
import { sortCameraListProducts } from '../utils/categoryListOrder.js'
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
  return label === 'CAMERA'
}

const { products: cameraItems } = useCategoryProducts('camera', cameraProducts, { optionsMode: 'lite' })
const activeSubCategory = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const subCategoryTabs = useCameraSubCategoryTabs(cameraItems)

const sortedCameraItems = computed(() => sortCameraListProducts(cameraItems.value))

function isCameraVisible(item) {
  return activeSubCategory.value === 'ALL' || resolveCameraListSections(item).includes(activeSubCategory.value)
}
</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>CAMERA</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'CAMERA' }"
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
          v-for="item in sortedCameraItems"
          :key="item.id"
          v-show="isCameraVisible(item)"
          :to="`/camera/${item.id}`"
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
