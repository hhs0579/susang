<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { cameraProducts } from '../data/cameraData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'

const route = useRoute()
const { getProductById } = useCategoryProducts('camera', cameraProducts)

const product = computed(() => getProductById(route.params.id))
const optionGroups = computed(() => product.value?.options || [])
const selectedImageIndex = ref(0)
const selectedOptions = reactive({})

const galleryImages = computed(() => {
  if (!product.value) return []
  return [product.value.image, ...(product.value.accessories || [])].filter(Boolean)
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || '')

function parseOptionEntry(entry) {
  const match = entry.match(/\+([\d,]+)\s*$/)
  const extraPrice = match ? Number(match[1].replaceAll(',', '')) : 0
  const label = entry.replace(/\s*\+[\d,]+\s*$/, '').trim()
  return { label, extraPrice }
}

const parsedOptionGroups = computed(() =>
  optionGroups.value.map((group, groupIndex) => ({
    groupIndex,
    title: group.group,
    isSingle: group.group.includes('Single'),
    items: (group.items || []).map((entry, itemIndex) => {
      const parsed = parseOptionEntry(entry)
      return {
        ...parsed,
        id: `${groupIndex}-${itemIndex}`,
      }
    }),
  })),
)

const selectedExtraPrice = computed(() => {
  let total = 0
  parsedOptionGroups.value.forEach((group) => {
    const selected = selectedOptions[group.groupIndex]
    if (!selected) return
    if (group.isSingle) {
      total += selected.extraPrice || 0
      return
    }
    selected.forEach((item) => {
      total += item.extraPrice || 0
    })
  })
  return total
})

const totalPrice = computed(() => (product.value?.discountPrice || 0) + selectedExtraPrice.value)
const hasDiscountPrice = computed(
  () => Number(product.value?.originalPrice || 0) > Number(product.value?.discountPrice || 0),
)
const displayPrice = computed(() =>
  hasDiscountPrice.value
    ? Number(product.value?.discountPrice || 0)
    : Number(product.value?.originalPrice || product.value?.discountPrice || 0),
)

function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function selectImage(index) {
  selectedImageIndex.value = index
}

function showPrevImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value =
    (selectedImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function showNextImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value = (selectedImageIndex.value + 1) % galleryImages.value.length
}

function isSelected(group, item) {
  const selected = selectedOptions[group.groupIndex]
  if (!selected) return false
  if (group.isSingle) return selected.id === item.id
  return selected.some((entry) => entry.id === item.id)
}

function toggleOption(group, item) {
  if (group.isSingle) {
    selectedOptions[group.groupIndex] = item
    return
  }

  const selected = selectedOptions[group.groupIndex] || []
  const exists = selected.some((entry) => entry.id === item.id)
  selectedOptions[group.groupIndex] = exists
    ? selected.filter((entry) => entry.id !== item.id)
    : [...selected, item]
}

const menuItems = [
  { label: 'SET', to: '/set' },
  { label: 'CAMERA', to: '/camera' },
  { label: 'LENS', to: '/lens' },
  { label: 'GRIP', to: '/grip' },
  { label: 'MONITOR', to: '/monitor' },
  { label: 'LIGHT', to: '/category/light' },
  { label: 'INTERCOM', to: '/intercom' },
]

function isActiveMenu(label) {
  return label === 'CAMERA'
}

watch(
  () => route.params.id,
  () => {
    selectedImageIndex.value = 0
    Object.keys(selectedOptions).forEach((key) => delete selectedOptions[key])
  },
)
</script>

<template>
  <main v-if="product" class="camera-detail-page">
    <header class="topbar">
      <RouterLink to="/" class="logo">
        <img src="/assets/images/logo1.png" alt="SUSANG RENTAL HOUSE" class="logo-image" />
      </RouterLink>
      <nav class="menu">
        <RouterLink
          v-for="item in menuItems"
          :key="item.label"
          :to="item.to"
          class="menu-item"
          :class="{ active: isActiveMenu(item.label) }"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink to="/guide" class="menu-item">이용안내</RouterLink>
        <a href="#" class="menu-item">할인정보</a>
      </nav>
    </header>

    <section class="detail-wrap">
      <div class="detail-left">
        <RouterLink to="/camera" class="back-link">&lt; Back to Category</RouterLink>
        <div class="detail-main-image">
          <button type="button" class="image-nav image-nav-left" @click="showPrevImage">&lt;</button>
          <img :src="selectedImage" :alt="product.name" />
          <button type="button" class="image-nav image-nav-right" @click="showNextImage">&gt;</button>
        </div>
        <div class="detail-sub-images">
          <button
            v-for="(item, index) in galleryImages"
            :key="`${item}-${index}`"
            type="button"
            class="detail-sub-thumb"
            :class="{ active: selectedImageIndex === index }"
            @click="selectImage(index)"
          >
            <img :src="item" :alt="`${product.name} image ${index + 1}`" />
          </button>
          <div v-if="!galleryImages.length" class="detail-sub-thumb empty-thumb">
            이미지 없음
          </div>
        </div>
      </div>

      <div class="detail-right">
        <p class="detail-brand">{{ product.brand }}</p>
        <h1>{{ product.name }}</h1>
        <p v-if="hasDiscountPrice" class="detail-original">{{ formatWon(product.originalPrice) }}</p>
        <p class="detail-price">
          {{ formatWon(displayPrice) }}
          <span v-if="hasDiscountPrice" class="detail-price-note">카메라 대여시 할인가</span>
        </p>

        <h2>COMPONENT LIST</h2>
        <ul class="component-box">
          <li v-for="component in product.baseComponents" :key="component">{{ component }}</li>
        </ul>

        <h2>DETAIL SELECT</h2>
        <div class="option-panels">
          <details v-for="group in parsedOptionGroups" :key="group.title" class="option-panel" open>
            <summary>{{ group.title }}</summary>
            <ul class="option-list">
              <li v-for="item in group.items" :key="item.id">
                <button
                  type="button"
                  class="option-choice"
                  :class="{ active: isSelected(group, item) }"
                  @click="toggleOption(group, item)"
                >
                  <span>{{ item.label }}</span>
                  <b>{{ item.extraPrice ? `+${formatCurrency(item.extraPrice)}` : '+₩0' }}</b>
                </button>
              </li>
            </ul>
          </details>
        </div>

        <div class="detail-checkout">
          <strong>{{ formatWon(totalPrice) }}</strong>
          <button type="button">선택 견적서 보내기</button>
        </div>
      </div>
    </section>
  </main>

  <main v-else class="camera-not-found">
    <h1>상품을 찾을 수 없습니다.</h1>
    <RouterLink to="/camera">카메라 목록으로 돌아가기</RouterLink>
  </main>
</template>
