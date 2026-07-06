<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useContentStore } from "../stores/contentStore";
import SiteHeader from "../components/SiteHeader.vue";
import SiteFooter from "../components/SiteFooter.vue";
import { categoryPathFor } from "../composables/useCategoryNavigation";
import { productDetailPath } from "../utils/productSlug";
import { getDisplayHeadlinePrice } from "../composables/useCategoryProducts";

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
const activeHeroIndex = ref(0);
const categoryGridRef = ref(null);
const marqueeTrackRef = ref(null);
const marqueeDurationSec = ref(48);
let marqueeResizeObserver = null;
let heroTimerId = null;

/** 줄/페이지 단위 휠을 픽셀로 환산 (deltaMode 대응) */
function wheelPixels(e) {
  const line = 40;
  const pageH = typeof window !== "undefined" ? window.innerHeight : 600;
  const pageW = typeof window !== "undefined" ? window.innerWidth : 800;
  let dx = e.deltaX;
  let dy = e.deltaY;
  if (e.deltaMode === 1) {
    dx *= line;
    dy *= line;
  } else if (e.deltaMode === 2) {
    dx *= pageW;
    dy *= pageH;
  }
  return { dx, dy };
}

let unbindCategoryGridWheel = () => {};

watch(
  categoryGridRef,
  (el) => {
    unbindCategoryGridWheel();
    unbindCategoryGridWheel = () => {};
    if (!el) return;

    let rafId = 0;
    let pendingDelta = 0;

    function applyPendingScroll() {
      rafId = 0;
      if (pendingDelta === 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        pendingDelta = 0;
        return;
      }

      const d = pendingDelta;
      pendingDelta = 0;
      const prev = el.scrollLeft;
      if (d > 0 && prev >= maxScroll - 0.5) return;
      if (d < 0 && prev <= 0.5) return;

      el.scrollLeft = Math.min(maxScroll, Math.max(0, prev + d));
    }

    function onCategoryGridWheel(e) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const { dx, dy } = wheelPixels(e);
      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (delta === 0) return;

      const prev = el.scrollLeft;
      if (delta > 0 && prev >= maxScroll - 0.5) return;
      if (delta < 0 && prev <= 0.5) return;

      pendingDelta += delta;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          applyPendingScroll();
        });
      }
      e.preventDefault();
    }

    el.addEventListener("wheel", onCategoryGridWheel, { passive: false });
    unbindCategoryGridWheel = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      pendingDelta = 0;
      el.removeEventListener("wheel", onCategoryGridWheel);
    };
  },
  { flush: "post", immediate: true },
);
const heroBannerImagesPC = computed(() => {
  const list = Array.isArray(state.heroBannerImages) ? state.heroBannerImages : [];
  if (list.length) return list;
  return [state.heroBannerImageUrl].filter(Boolean);
});
const heroBannerImagesMobile = computed(() => {
  const list = Array.isArray(state.heroBannerImagesMobile) ? state.heroBannerImagesMobile : [];
  return list.filter(Boolean);
});

const isMobileViewport = ref(
  typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
);
let heroMediaQuery = null;
function updateHeroViewport(e) {
  isMobileViewport.value = e.matches;
}

const heroBannerImages = computed(() => {
  const mobile = heroBannerImagesMobile.value;
  const pc = heroBannerImagesPC.value;
  if (isMobileViewport.value) {
    // 모바일에서는 등록한 배너만 사용 (설정과 다른 PC 배너가 섞이지 않도록 함)
    if (mobile.length) return mobile;
    // 모바일 전용 배너가 없을 때만 PC 배너 폴백
    return pc.length ? pc : mobile;
  }
  return pc;
});
const loadedHeroImages = ref([]);

function preloadHeroImages(urls) {
  if (typeof window === "undefined") {
    loadedHeroImages.value = [...urls.filter(Boolean)];
    return;
  }
  const ordered = urls.map((u) => String(u || "").trim()).filter(Boolean);
  if (!ordered.length) {
    loadedHeroImages.value = [];
    return;
  }

  const unique = [...new Set(ordered)];
  const doneSet = new Set();
  const markDone = (url) => {
    doneSet.add(url);
    if (doneSet.size === unique.length) {
      // 원본 순서·개수 유지 (동일 URL이 여러 장이어도 슬라이드 수가 줄어들지 않음)
      loadedHeroImages.value = [...ordered];
    }
  };

  unique.forEach((url) => {
    const image = new Image();
    image.onload = () => markDone(url);
    image.onerror = () => markDone(url);
    image.src = url;
  });
}

const heroDisplayImages = computed(() =>
  loadedHeroImages.value.length ? loadedHeroImages.value : heroBannerImages.value,
);
const heroBannerTitle = computed(() => String(state.heroBannerTitle ?? "").trim());
const heroBannerDescriptionLines = computed(() => {
  if (!Array.isArray(state.heroBannerDescriptionLines)) return [];
  return state.heroBannerDescriptionLines.map((line) => String(line || "").trim()).filter(Boolean);
});

const heroSlideCount = computed(() => heroDisplayImages.value.length);

function clearHeroTimer() {
  if (heroTimerId) {
    clearInterval(heroTimerId);
    heroTimerId = null;
  }
}

function startHeroTimer() {
  clearHeroTimer();
  heroTimerId = setInterval(() => {
    const len = heroSlideCount.value;
    if (len <= 1) return;
    activeHeroIndex.value = (activeHeroIndex.value + 1) % len;
  }, 4500);
}

/** 수동 이동 후 자동 타이머를 다시 처음부터 돌려, 사용자가 누른 슬라이드가 충분히 머물게 함 */
function goToHeroSlide(targetIndex) {
  const len = heroSlideCount.value;
  if (len <= 0) return;
  const next = ((targetIndex % len) + len) % len;
  if (next === activeHeroIndex.value) {
    startHeroTimer();
    return;
  }
  activeHeroIndex.value = next;
  startHeroTimer();
}

function nextHeroSlide() {
  goToHeroSlide(activeHeroIndex.value + 1);
}

function prevHeroSlide() {
  goToHeroSlide(activeHeroIndex.value - 1);
}

let heroTouchStartX = 0;
let heroTouchStartY = 0;
let heroTouchTracking = false;
const HERO_SWIPE_THRESHOLD = 40;

function onHeroTouchStart(event) {
  if (heroSlideCount.value <= 1) return;
  const touch = event.touches?.[0];
  if (!touch) return;
  heroTouchStartX = touch.clientX;
  heroTouchStartY = touch.clientY;
  heroTouchTracking = true;
}

function onHeroTouchEnd(event) {
  if (!heroTouchTracking) return;
  heroTouchTracking = false;
  const touch = event.changedTouches?.[0];
  if (!touch) return;
  const dx = touch.clientX - heroTouchStartX;
  const dy = touch.clientY - heroTouchStartY;
  if (Math.abs(dx) < HERO_SWIPE_THRESHOLD) return;
  if (Math.abs(dx) < Math.abs(dy)) return;
  if (dx < 0) nextHeroSlide();
  else prevHeroSlide();
}
function arrivalItemLink(item) {
  return productDetailPath(item?.category, item);
}

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
  clearHeroTimer();
  if (heroMediaQuery) {
    if (typeof heroMediaQuery.removeEventListener === "function") {
      heroMediaQuery.removeEventListener("change", updateHeroViewport);
    } else if (typeof heroMediaQuery.removeListener === "function") {
      heroMediaQuery.removeListener(updateHeroViewport);
    }
    heroMediaQuery = null;
  }
  unbindCategoryGridWheel();
  if (marqueeResizeObserver) {
    marqueeResizeObserver.disconnect();
    marqueeResizeObserver = null;
  }
  if (unsubscribeProducts) unsubscribeProducts();
});

const ARRIVAL_VISIBLE_COUNT = 6;

/** New Arrivals: 신규 등록(createdAt) 우선. 썸네일만 수정한 기존 상품(updatedAt)은 아래로 */
function compareArrivalItems(a, b) {
  const aCreated = getTimestampMs(a?.createdAt);
  const bCreated = getTimestampMs(b?.createdAt);

  if (aCreated > 0 && bCreated > 0) return bCreated - aCreated;
  if (aCreated > 0) return -1;
  if (bCreated > 0) return 1;

  return getTimestampMs(b?.updatedAt) - getTimestampMs(a?.updatedAt);
}

const arrivalItems = computed(() => {
  if (!remoteProducts.value.length) return state.arrivalItems.slice(0, ARRIVAL_VISIBLE_COUNT);

  const registered = remoteProducts.value.filter((item) => getTimestampMs(item?.createdAt) > 0);
  const pool = registered.length ? registered : remoteProducts.value;

  return [...pool]
    .sort(compareArrivalItems)
    .slice(0, ARRIVAL_VISIBLE_COUNT)
    .map((item) => ({
      id: item.id,
      title: item.name || "상품명 없음",
      price: `₩${Number(getDisplayHeadlinePrice(item) || 0).toLocaleString("ko-KR")}`,
      imageUrl: item.mainImage || (Array.isArray(item.images) ? item.images[0] : "") || "",
      link: arrivalItemLink(item) || categoryPathFor(item.category),
    }));
});

/** 무한 흐름용으로 동일 시퀀스를 두 번 이어 붙임 */
const arrivalMarqueeItems = computed(() => {
  const row = arrivalItems.value;
  if (!row.length) return [];
  return [...row, ...row];
});

/** 고정 시간(초) + translate -50% 조합은 트랙 픽셀 너비가 바뀔 때마다 체감 속도가 달라짐 → px/s 일정하게 duration 산출 */
const ARRIVAL_MARQUEE_PX_PER_SEC = 38;

function updateArrivalMarqueeDuration() {
  const el = marqueeTrackRef.value;
  if (!el || !arrivalMarqueeItems.value.length) return;
  const loopPx = el.scrollWidth / 2;
  if (loopPx < 8) return;
  const sec = loopPx / ARRIVAL_MARQUEE_PX_PER_SEC;
  marqueeDurationSec.value = Math.min(180, Math.max(8, sec));
}

watch(
  arrivalMarqueeItems,
  () => {
    nextTick(() => updateArrivalMarqueeDuration());
  },
  { flush: "post" },
);

onMounted(() => {
  if (typeof window !== "undefined" && window.matchMedia) {
    heroMediaQuery = window.matchMedia("(max-width: 768px)");
    isMobileViewport.value = heroMediaQuery.matches;
    if (typeof heroMediaQuery.addEventListener === "function") {
      heroMediaQuery.addEventListener("change", updateHeroViewport);
    } else if (typeof heroMediaQuery.addListener === "function") {
      heroMediaQuery.addListener(updateHeroViewport);
    }
  }

  nextTick(() => {
    const el = marqueeTrackRef.value;
    updateArrivalMarqueeDuration();
    if (!el || typeof ResizeObserver === "undefined") return;
    marqueeResizeObserver?.disconnect();
    marqueeResizeObserver = new ResizeObserver(() => updateArrivalMarqueeDuration());
    marqueeResizeObserver.observe(el);
  });
});

watch(
  heroSlideCount,
  (len) => {
    if (activeHeroIndex.value >= len) activeHeroIndex.value = 0;
    startHeroTimer();
  },
  { immediate: true },
);

watch(
  heroBannerImages,
  (next, prev) => {
    if (!next.length) {
      activeHeroIndex.value = 0;
      loadedHeroImages.value = [];
      return;
    }
    const prevKey = Array.isArray(prev) ? prev.join('|') : '';
    const nextKey = next.join('|');
    if (prevKey !== nextKey) {
      // 슬라이드 풀이 바뀌었으면 인덱스를 처음으로 되돌리고, 프리로드 결과를 새로 적용
      activeHeroIndex.value = 0;
      loadedHeroImages.value = [];
    }
    preloadHeroImages(next);
    if (activeHeroIndex.value >= next.length) activeHeroIndex.value = 0;
    startHeroTimer();
  },
  { immediate: true },
);

const menuItems = [
  { label: "SET", to: "/set" },
  { label: "CAMERA", to: "/camera" },
  { label: "LENS", to: "/lens" },
  { label: "GRIP", to: "/grip" },
  { label: "MONITOR", to: "/monitor" },
  { label: "LIGHT", to: "/light" },
  { label: "INTERCOM", to: "/intercom" },
];

const categoryLinkMap = {
  SET: "/set",
  CAMERA: "/camera",
  LENS: "/lens",
  SUPPORT: "/support",
  GRIP: "/grip",
  MONITOR: "/monitor",
  LIGHT: "/light",
  INTERCOM: "/intercom",
};

function getCategoryLink(name) {
  return categoryLinkMap[name] || "/";
}
</script>

<template>
  <div class="page">
    <SiteHeader />

    <section
      class="hero"
      @touchstart.passive="onHeroTouchStart"
      @touchend.passive="onHeroTouchEnd"
    >
      <div
        v-for="(image, index) in heroDisplayImages"
        :key="`hero-slide-${index}`"
        class="hero-bg-layer"
        :class="{ 'is-active': index === activeHeroIndex % Math.max(heroSlideCount, 1) }"
        :style="{
          backgroundImage: `url('${image}')`,
        }"
      ></div>
      <div class="hero-overlay">
        <h1 v-if="heroBannerTitle">{{ heroBannerTitle }}</h1>
        <p v-if="heroBannerDescriptionLines.length">
          <span
            v-for="(line, lineIndex) in heroBannerDescriptionLines"
            :key="`hero-desc-line-${lineIndex}`"
            class="hero-desc-line"
          >
            {{ line }}
          </span>
        </p>
      </div>

      <template v-if="heroSlideCount > 1">
        <button
          type="button"
          class="hero-nav hero-nav--prev"
          aria-label="이전 배너"
          @click="prevHeroSlide"
        >
          <span aria-hidden="true">&#10094;</span>
        </button>
        <button
          type="button"
          class="hero-nav hero-nav--next"
          aria-label="다음 배너"
          @click="nextHeroSlide"
        >
          <span aria-hidden="true">&#10095;</span>
        </button>

        <div class="hero-dots" role="tablist" aria-label="배너 인디케이터">
          <button
            v-for="(_, index) in heroDisplayImages"
            :key="`hero-dot-${index}`"
            type="button"
            role="tab"
            class="hero-dot"
            :class="{ 'is-active': index === activeHeroIndex % Math.max(heroSlideCount, 1) }"
            :aria-selected="index === activeHeroIndex % Math.max(heroSlideCount, 1)"
            :aria-label="`배너 ${index + 1}로 이동`"
            @click="goToHeroSlide(index)"
          ></button>
        </div>
      </template>
    </section>

    <section class="section category">
      <h2>수상한렌탈</h2>
      <p class="section-sub">시네마 촬영 장비 렌탈</p>
      <div ref="categoryGridRef" class="grid category-grid">
        <RouterLink
          v-for="item in state.categoryItems"
          :key="item.id"
          :to="getCategoryLink(item.name)"
          class="card category-card"
        >
          <img
            v-if="item.imageUrl"
            :key="`${item.id}-${item.imageUrl}`"
            :src="item.imageUrl"
            :alt="item.name"
            class="thumb thumb-img"
            loading="lazy"
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
      <div class="arrival-marquee" role="region" aria-label="New Arrivals">
        <div
          ref="marqueeTrackRef"
          class="arrival-marquee-track"
          :style="{ '--arrival-marquee-duration': `${marqueeDurationSec}s` }"
        >
          <RouterLink
            v-for="(item, idx) in arrivalMarqueeItems"
            :key="`${item.id}-${idx}`"
            :to="item.link || '/camera'"
            class="card arrival-card arrival-card--marquee"
          >
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.title"
              class="thumb thumb-img thumb-arrival"
              loading="lazy"
            />
            <div v-else class="thumb thumb-arrival"></div>
            <div class="meta meta-arrival">
              <strong>{{ item.title }}</strong>
              <span>{{ item.price }}</span>
            </div>
          </RouterLink>
        </div>
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

    <SiteFooter />
  </div>
</template>
