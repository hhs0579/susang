<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { gripProducts } from '../data/gripData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'

const route = useRoute()
const { getProductById } = useCategoryProducts('grip', gripProducts)
const product = computed(() => getProductById(route.params.id))
const optionGroups = computed(() => product.value?.options || [])
const selectedImageIndex = ref(0)
const selectedOptions = reactive({})

const menuItems = [
  { label: 'SET', to: '/category/set' },
  { label: 'CAMERA', to: '/camera' },
  { label: 'LENS', to: '/lens' },
  { label: 'GRIP', to: '/grip' },
  { label: 'MONITOR', to: '/monitor' },
  { label: 'LIGHT', to: '/category/light' },
  { label: 'INTERCOM', to: '/intercom' },
]

const galleryImages = computed(() => {
  if (!product.value) return []
  return [product.value.image, ...(product.value.accessories || [])].filter(Boolean)
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || '')

function parseOptionEntry(entry) {
  const match = entry.match(/\+([\d,]+)/)
  const extraPrice = match ? Number(match[1].replaceAll(',', '')) : 0
  const label = entry.replace(/\s*\+[\d,]+/, '').trim()
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

function isActiveMenu(label) {
  return label === 'GRIP'
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
        <RouterLink to="/grip" class="back-link">&lt; Back to Category</RouterLink>
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
        </div>
      </div>

      <div class="detail-right">
        <p class="detail-brand">{{ product.section }}</p>
        <h1>{{ product.name }}</h1>
        <p class="detail-price">{{ formatCurrency(product.discountPrice) }} / 24H</p>
        <p class="detail-original">원가 {{ formatCurrency(product.originalPrice) }}</p>

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
          <strong>{{ formatCurrency(totalPrice) }} / 24H</strong>
          <button type="button">선택 견적서 보내기</button>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-left">
        <img src="/assets/images/logo2.png" alt="susang rental" class="footer-logo" />
        <p>상호명 주식회사 수상한렌탈</p>
        <p>대표 김민국</p>
        <p>주소 서울시 마포구 잔다리로3길 7 1층</p>
        <p>사업자등록증번호 326-88-03299</p>
        <p>이메일 susanghanrental@gmail.com</p>
        <p>대표 번호 010- 4139-9844</p>
        <p>카카오톡 채널 http://pf.kakao.com/_xbxcxhhK</p>
      </div>
      <div class="footer-right">
        <p class="footer-account">830501-04-254913</p>
        <p>국민은행 / 예금주 : 주식회사 수상한렌탈</p>
        <p class="footer-social">Instagram YouTube</p>
        <p class="footer-copy">Copyright © susanghanrental. All rights reserved.</p>
      </div>
    </footer>
  </main>

  <main v-else class="camera-not-found">
    <h1>상품을 찾을 수 없습니다.</h1>
    <RouterLink to="/grip">그립 목록으로 돌아가기</RouterLink>
  </main>
</template>
