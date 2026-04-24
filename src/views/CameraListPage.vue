<script setup>
import { RouterLink } from 'vue-router'
import { cameraProducts } from '../data/cameraData'
import { formatCurrency, useCategoryProducts } from '../composables/useCategoryProducts'

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
  return label === 'CAMERA'
}

const { products: cameraItems } = useCategoryProducts('camera', cameraProducts)
</script>

<template>
  <main class="camera-page">
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

    <section class="camera-header">
      <h1>CAMERA</h1>
      <p>Professional Cinema Equipment</p>
      <div class="camera-tabs">
        <span>SET</span>
        <span class="active">CAMERA</span>
        <span>LENS</span>
        <span>GRIP</span>
        <span>MONITOR</span>
      </div>
    </section>

    <section class="camera-grid-wrap">
      <div class="camera-grid">
        <RouterLink v-for="item in cameraItems" :key="item.id" :to="`/camera/${item.id}`" class="camera-card">
          <div class="camera-thumb-wrap">
            <img :src="item.image" :alt="item.name" class="camera-thumb" />
          </div>
          <div class="camera-meta">
            <strong>{{ item.name }}</strong>
            <span>{{ item.brand }}</span>
            <b>{{ formatCurrency(item.discountPrice) }}</b>
          </div>
        </RouterLink>
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
</template>
