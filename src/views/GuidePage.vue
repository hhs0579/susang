<script setup>
import { RouterLink } from "vue-router";
import SiteHeader from "../components/SiteHeader.vue";
import SiteFooter from "../components/SiteFooter.vue";
import { computed } from "vue";
import { useContentStore } from "../stores/contentStore";

const menuItems = [
  { label: "SET", to: "/set" },
  { label: "CAMERA", to: "/camera" },
  { label: "LENS", to: "/lens" },
  { label: "GRIP", to: "/grip" },
  { label: "MONITOR", to: "/monitor" },
  { label: "LIGHT", to: "/light" },
  { label: "INTERCOM", to: "/intercom" },
];
const { state } = useContentStore();
const guideCards = computed(() =>
  Array.isArray(state.guideInfoCardTexts) && state.guideInfoCardTexts.length
    ? state.guideInfoCardTexts
    : [],
);
const guideSteps = computed(() => (Array.isArray(state.guideSteps) && state.guideSteps.length ? state.guideSteps : []));

function splitLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
</script>

<template>
  <main class="guide-page">
    <SiteHeader />

    <section class="guide-first-section">
      <section class="guide-hero">
        <h1>이용안내</h1>
        <p>수상한렌탈의 장비 대여 방법과 이용 절차를 안내합니다</p>
      </section>

      <section class="guide-info-grid">
        <article class="guide-info-card inquiry-card">
          <h3>
            <img src="/assets/images/icon1.png" alt="" class="guide-icon" />
            <template v-for="(line, idx) in splitLines(guideCards[0]?.title)" :key="`guide-card-0-title-${idx}`">
              {{ line }}
              <br v-if="idx < splitLines(guideCards[0]?.title).length - 1" />
            </template>
          </h3>
          <p v-for="(line, idx) in splitLines(guideCards[0]?.body)" :key="`guide-card-0-body-${idx}`">{{ line }}</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon2.png" alt="" class="guide-icon" />
            <template v-for="(line, idx) in splitLines(guideCards[1]?.title)" :key="`guide-card-1-title-${idx}`">
              {{ line }}
              <br v-if="idx < splitLines(guideCards[1]?.title).length - 1" />
            </template>
          </h3>
          <p v-for="(line, idx) in splitLines(guideCards[1]?.body)" :key="`guide-card-1-body-${idx}`">{{ line }}</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon3.png" alt="" class="guide-icon" />
            <template v-for="(line, idx) in splitLines(guideCards[2]?.title)" :key="`guide-card-2-title-${idx}`">
              {{ line }}
              <br v-if="idx < splitLines(guideCards[2]?.title).length - 1" />
            </template>
          </h3>
          <p v-for="(line, idx) in splitLines(guideCards[2]?.body)" :key="`guide-card-2-body-${idx}`">{{ line }}</p>
        </article>
        <article class="guide-info-card">
          <h3>
            <img src="/assets/images/icon4.png" alt="" class="guide-icon" />
            <template v-for="(line, idx) in splitLines(guideCards[3]?.title)" :key="`guide-card-3-title-${idx}`">
              {{ line }}
              <br v-if="idx < splitLines(guideCards[3]?.title).length - 1" />
            </template>
          </h3>
          <p v-for="(line, idx) in splitLines(guideCards[3]?.body)" :key="`guide-card-3-body-${idx}`">{{ line }}</p>
          <div class="guide-inquiry-bottom">
            <p>{{ guideCards[3]?.footer || '7:00 am - 11:00 pm 상담 가능' }}</p>
            <a
              href="http://pf.kakao.com/_xbxcxhhK"
              target="_blank"
              rel="noreferrer"
              class="guide-kakao-link"
              aria-label="카카오톡 예약 문의 바로가기"
            >
              <svg
                class="guide-kakao-link-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 4.5C6.75 4.5 2.5 8.01 2.5 12.33C2.5 14.99 4.11 17.34 6.56 18.73L5.77 21.5L8.89 19.8C9.87 20.03 10.91 20.16 12 20.16C17.25 20.16 21.5 16.65 21.5 12.33C21.5 8.01 17.25 4.5 12 4.5Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
              </svg>
              <span>카카오톡</span>
            </a>
          </div>
        </article>
      </section>
    </section>

    <section class="guide-steps">
      <article v-for="(item, index) in guideSteps.slice(0, 3)" :key="`guide-step-${index}`" class="guide-step-card">
        <strong>{{ item.step }}</strong>
        <h4>{{ item.title }}</h4>
        <p v-if="item.subtitle"><b>{{ item.subtitle }}</b></p>
        <p v-for="(line, idx) in splitLines(item.body)" :key="`guide-step-body-${index}-${idx}`">{{ line }}</p>
        <p v-if="item.extraTitle"><b>{{ item.extraTitle }}</b></p>
        <p v-for="(line, idx) in splitLines(item.extraBody)" :key="`guide-step-extra-${index}-${idx}`">{{ line }}</p>
      </article>
    </section>

    <SiteFooter />
  </main>
</template>
