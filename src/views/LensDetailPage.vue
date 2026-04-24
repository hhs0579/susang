<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { lensProducts } from '../data/lensData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'

const route = useRoute()
const { getProductById } = useCategoryProducts('lens', lensProducts)
const product = computed(() => getProductById(route.params.id))
const optionGroups = computed(() => product.value?.options || [])
const selectedImageIndex = ref(0)

const galleryImages = computed(() => {
  if (!product.value) return []
  return [product.value.image, ...(product.value.accessories || [])].filter(Boolean)
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || '')

const menuItems = [
  { label: 'SET', to: '/category/set' },
  { label: 'CAMERA', to: '/camera' },
  { label: 'LENS', to: '/lens' },
  { label: 'GRIP', to: '/grip' },
  { label: 'MONITOR', to: '/monitor' },
  { label: 'LIGHT', to: '/category/light' },
  { label: 'INTERCOM', to: '/intercom' },
]

function isActiveMenu(label) {
  return label === 'LENS'
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

watch(
  () => route.params.id,
  () => {
    selectedImageIndex.value = 0
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
        <RouterLink to="/lens" class="back-link">&lt; Back to Category</RouterLink>
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
        <p class="detail-brand">{{ product.section }}</p>
        <h1>{{ product.name }}</h1>
        <p class="detail-price">{{ formatCurrency(product.discountPrice) }} / 24H</p>
        <p class="detail-original">원가 {{ formatCurrency(product.originalPrice) }}</p>

        <h2>COMPONENT LIST</h2>
        <ul class="component-box">
          <li v-if="!product.baseComponents.length">기본 구성품 없음</li>
          <li v-for="component in product.baseComponents" :key="component">{{ component }}</li>
        </ul>

        <h2>DETAIL SELECT</h2>
        <div class="option-panels">
          <details v-for="group in optionGroups" :key="group.group" class="option-panel" open>
            <summary>{{ group.group }}</summary>
            <ul>
              <li v-for="entry in group.items" :key="entry">{{ entry }}</li>
            </ul>
          </details>
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
    <RouterLink to="/lens">렌즈 목록으로 돌아가기</RouterLink>
  </main>
</template>
