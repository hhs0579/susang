<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useContentStore } from '../stores/contentStore'

const route = useRoute()
const { state } = useContentStore()

const categorySlugMap = {
  set: 'SET',
  lens: 'LENS',
  grip: 'GRIP',
  monitor: 'MONITOR',
  light: 'LIGHT',
  intercom: 'INTERCOM',
}

const menuItems = [
  { label: 'SET', to: '/category/set' },
  { label: 'CAMERA', to: '/camera' },
  { label: 'LENS', to: '/lens' },
  { label: 'GRIP', to: '/grip' },
  { label: 'MONITOR', to: '/monitor' },
  { label: 'LIGHT', to: '/category/light' },
  { label: 'INTERCOM', to: '/intercom' },
]

const categoryName = computed(() => categorySlugMap[route.params.slug] || '')
const category = computed(() => state.categoryItems.find((item) => item.name === categoryName.value))

function isActiveMenu(label) {
  return label === categoryName.value
}
</script>

<template>
  <main class="category-page">
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

    <section v-if="category" class="category-landing">
      <h1>{{ category.name }}</h1>
      <p>{{ category.desc }}</p>
      <img :src="category.imageUrl" :alt="category.name" class="category-hero-image" />
    </section>

    <section v-else class="category-landing">
      <h1>카테고리를 찾을 수 없습니다.</h1>
      <RouterLink to="/" class="section-link">메인으로 돌아가기 &gt;</RouterLink>
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
</template>
