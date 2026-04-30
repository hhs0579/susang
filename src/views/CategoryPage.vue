<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useContentStore } from '../stores/contentStore'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const route = useRoute()
const { state } = useContentStore()

const categorySlug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const category = computed(() => {
  const byCard = state.categoryItems.find(
    (item) => String(item.name || '').trim().toLowerCase() === categorySlug.value,
  )
  if (byCard) return byCard

  const existsInTaxonomy = (state.taxonomyCategories || []).some(
    (item) => String(item || '').trim().toLowerCase() === categorySlug.value,
  )
  if (!existsInTaxonomy) return null

  return {
    id: `fallback-${categorySlug.value}`,
    name: categorySlug.value.toUpperCase(),
    desc: `${categorySlug.value.toUpperCase()} 카테고리`,
    imageUrl: '/assets/images/main1.png',
  }
})
</script>

<template>
  <main class="category-page">
    <SiteHeader />

    <section v-if="category" class="category-landing">
      <h1>{{ category.name }}</h1>
      <p>{{ category.desc }}</p>
      <img :src="category.imageUrl" :alt="category.name" class="category-hero-image" />
      <RouterLink v-if="category.name === 'SET'" to="/set" class="section-link category-set-link">
        세트 장비 세부 목록 보기 &gt;
      </RouterLink>
      <RouterLink v-if="category.name === 'LIGHT'" to="/light" class="section-link category-set-link">
        라이트 장비 세부 목록 보기 &gt;
      </RouterLink>
    </section>

    <section v-else class="category-landing">
      <h1>카테고리를 찾을 수 없습니다.</h1>
      <RouterLink to="/" class="section-link">메인으로 돌아가기 &gt;</RouterLink>
    </section>

    <SiteFooter />
  </main>
</template>
