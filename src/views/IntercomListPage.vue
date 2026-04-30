<script setup>
import { RouterLink } from 'vue-router'
import { intercomProducts } from '../data/intercomData'
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
  return label === 'INTERCOM'
}

const { products: intercomItems } = useCategoryProducts('intercom', intercomProducts)

const { categoryTabs } = useCategoryNavigation()

</script>

<template>
  <main class="camera-page">
    <SiteHeader />

    <section class="camera-header">
      <h1>INTERCOM</h1>
      <div class="camera-tabs">
        <RouterLink
          v-for="tab in categoryTabs"
          :key="tab.label"
          :to="tab.to"
          class="camera-tab-link"
          :class="{ active: tab.label === 'INTERCOM' }"
        >
          {{ tab.label }}
        </RouterLink>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid lens-grid">
        <RouterLink
          v-for="item in intercomItems"
          :key="item.id"
          :to="`/intercom/${item.id}`"
          class="camera-card"
        >
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
