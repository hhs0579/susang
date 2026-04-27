<script setup>
import { computed, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useContentStore } from "../stores/contentStore";

const guideItems = [
  {
    step: "01",
    title: "장비 선택",
    text: "원하는 장비를 확인하고 예약을 신청하세요",
  },
  {
    step: "02",
    title: "예약 문의",
    text: "가능한 일정과 상태를 빠르게 안내해드립니다",
  },
  { step: "03", title: "당일 대여", text: "예약 확정 후 안전하게 픽업하세요" },
];

const { state } = useContentStore();
const remoteProducts = ref([]);
const arrivalLinkMap = {
  set: (id) => `/set/${id}`,
  camera: (id) => `/camera/${id}`,
  lens: (id) => `/lens/${id}`,
  grip: (id) => `/grip/${id}`,
  monitor: (id) => `/monitor/${id}`,
  intercom: (id) => `/intercom/${id}`,
};

function getTimestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return 0;
}

let unsubscribeProducts = null;
if (db) {
  unsubscribeProducts = onSnapshot(collection(db, "product"), (snapshot) => {
    remoteProducts.value = snapshot.docs.map((entry) => ({
      id: entry.id,
      ...entry.data(),
    }));
  });
}

onUnmounted(() => {
  if (unsubscribeProducts) unsubscribeProducts();
});

const arrivalItems = computed(() => {
  if (!remoteProducts.value.length) return state.arrivalItems;

  return [...remoteProducts.value]
    .sort((a, b) => {
      const aTs = getTimestampMs(a.createdAt) || getTimestampMs(a.updatedAt);
      const bTs = getTimestampMs(b.createdAt) || getTimestampMs(b.updatedAt);
      return bTs - aTs;
    })
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.name || "상품명 없음",
      price: `₩${Number(item.discountPrice || 0).toLocaleString("ko-KR")}`,
      imageUrl: item.mainImage || (Array.isArray(item.images) ? item.images[0] : "") || "",
      link: arrivalLinkMap[item.category]?.(item.id) || "/",
    }));
});

const menuItems = [
  { label: "SET", to: "/set" },
  { label: "CAMERA", to: "/camera" },
  { label: "LENS", to: "/lens" },
  { label: "GRIP", to: "/grip" },
  { label: "MONITOR", to: "/monitor" },
  { label: "LIGHT", to: "/category/light" },
  { label: "INTERCOM", to: "/intercom" },
];

const categoryLinkMap = {
  SET: "/set",
  CAMERA: "/camera",
  LENS: "/lens",
  GRIP: "/grip",
  MONITOR: "/monitor",
  LIGHT: "/category/light",
  INTERCOM: "/intercom",
};

function getCategoryLink(name) {
  return categoryLinkMap[name] || "/";
}
</script>

<template>
  <div class="page">
    <header class="topbar">
      <RouterLink to="/" class="logo">
        <img
          src="/assets/images/logo1.png"
          alt="SUSANG RENTAL HOUSE"
          class="logo-image"
        />
      </RouterLink>
      <nav class="menu">
        <RouterLink
          v-for="item in menuItems"
          :key="item.label"
          :to="item.to"
          class="menu-item"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink to="/guide" class="menu-item">이용안내</RouterLink>
        <a href="#" class="menu-item">할인정보</a>
      </nav>
    </header>

    <section class="hero">
      <div class="hero-overlay">
        <h1>감독이 운영하는 감독을 위한 렌탈</h1>
        <p>
          <span class="hero-desc-line">수상한렌탈은 수상한움직임 프로덕션 소속 렌탈샵입니다.</span>
          <span class="hero-desc-line">촬영감독이 운영하며 감독님들께 저렴하고</span>
          <span class="hero-desc-line">실속 있는 장비 세팅으로 찾아뵙겠습니다.</span>
        </p>
        <a href="#" class="hero-link">장비 바로가기 &gt;</a>
      </div>
    </section>

    <section class="section category">
      <h2>SUSANG RENTAL</h2>
      <p class="section-sub">Professional Cinema Equipment Rental</p>
      <div class="grid category-grid">
        <RouterLink
          v-for="item in state.categoryItems"
          :key="item.id"
          :to="getCategoryLink(item.name)"
          class="card category-card"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="thumb thumb-img"
          />
          <div v-else class="thumb thumb-category"></div>
          <strong>{{ item.name }}</strong>
          <span>{{ item.desc }}</span>
        </RouterLink>
      </div>
      <a href="#" class="section-link">장비 둘러보기 &gt;</a>
    </section>

    <section class="section arrivals">
      <h3>New Arrivals</h3>
      <p class="section-sub">최신 입고 장비를 확인해보세요</p>
      <div class="grid arrival-grid">
        <RouterLink
          v-for="item in arrivalItems"
          :key="item.id"
          :to="item.link || '/camera'"
          class="card arrival-card"
        >
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.title"
            class="thumb thumb-img thumb-arrival"
          />
          <div v-else class="thumb thumb-arrival"></div>
          <div class="meta">
            <strong>{{ item.title }}</strong>
            <span>{{ item.price }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <section class="section guide">
      <h3>이용안내</h3>
      <p class="section-sub">장비 예약 및 대여 문의는 카카오톡 채널을 통해 간편하게 진행하실 수 있습니다</p>
      <div class="grid guide-grid">
        <article
          v-for="item in guideItems"
          :key="item.step"
          class="card guide-card"
        >
          <strong class="step">{{ item.step }}</strong>
          <h4>{{ item.title }}</h4>
          <p>{{ item.text }}</p>
        </article>
      </div>
      <RouterLink to="/guide" class="section-link">자세한 이용안내 보기 &gt;</RouterLink>
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
  </div>
</template>
