<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { setProducts } from '../data/setData'
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
  return label === 'SET'
}

const { products: setItems } = useCategoryProducts('set', setProducts)
const activeBrand = ref('ALL')

const { categoryTabs } = useCategoryNavigation()

const brandTabs = computed(() => {
  const brands = [...new Set(setItems.value.map((item) => item.brand).filter(Boolean))]
  return ['ALL', ...brands]
})

const filteredSetItems = computed(() => {
  if (activeBrand.value === 'ALL') return setItems.value
  return setItems.value.filter((item) => item.brand === activeBrand.value)
})
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
          v-for="brand in brandTabs"
          :key="brand"
          type="button"
          class="camera-brand-button"
          :class="{ active: activeBrand === brand }"
          @click="activeBrand = brand"
        >
          {{ brand }}
        </button>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid">
        <RouterLink v-for="item in filteredSetItems" :key="item.id" :to="`/set/${item.id}`" class="camera-card">
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
