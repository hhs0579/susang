<script setup>
import { computed } from 'vue'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { useContentStore } from '../stores/contentStore'

const { state } = useContentStore()
const discountText = computed(() => state.discountTextContent || {})
const rounds = computed(() =>
  Array.isArray(state.discountRoundColumns) && state.discountRoundColumns.length
    ? state.discountRoundColumns
    : [],
)

function splitLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
</script>

<template>
  <main class="discount-page">
    <SiteHeader />

    <section class="discount-wrap">
      <h1 class="discount-main-title">{{ discountText.mainTitle }}</h1>
      <p class="discount-main-sub">{{ discountText.mainSubtitle }}</p>

      <h2 class="discount-section-title">{{ discountText.independentTitle }}</h2>
      <div class="discount-box-grid">
        <article class="discount-box">
          <h3 class="discount-box-title">{{ discountText.independentBox1Title }}</h3>
          <p
            v-for="(line, idx) in splitLines(discountText.independentBox1Body)"
            :key="`ind-box-1-${idx}`"
            class="discount-text"
          >
            {{ line }}
          </p>
        </article>
        <article class="discount-box">
          <h3 class="discount-box-title">{{ discountText.independentBox2Title }}</h3>
          <p
            v-for="(line, idx) in splitLines(discountText.independentBox2Body)"
            :key="`ind-box-2-${idx}`"
            class="discount-text"
          >
            {{ line }}
          </p>
        </article>
      </div>

      <h2 class="discount-section-title">{{ discountText.roundTitle }}</h2>
      <p class="discount-section-sub">{{ discountText.roundSubtitle }}</p>
      <div class="discount-round-grid">
        <article v-for="(column, columnIndex) in rounds" :key="columnIndex" class="discount-round-column">
          <p v-for="([round, rate]) in column" :key="round" class="discount-round-item">
            <span>{{ round }}</span>
            <span class="discount-divider">ㅣ</span>
            <strong>{{ rate }}</strong>
          </p>
        </article>
      </div>

      <div class="discount-box-grid bottom">
        <article class="discount-box">
          <h3 class="discount-box-title">{{ discountText.prepayTitle }}</h3>
          <ul class="discount-list">
            <li v-for="(line, idx) in splitLines(discountText.prepayBody)" :key="`prepay-${idx}`">{{ line }}</li>
          </ul>
        </article>
        <article class="discount-box">
          <div class="discount-box-heading">
            <h3 class="discount-box-title">{{ discountText.regularTitle }}</h3>
            <span class="discount-new">{{ discountText.regularBadge }}</span>
          </div>
          <ul class="discount-list">
            <li v-for="(line, idx) in splitLines(discountText.regularBody)" :key="`regular-${idx}`">{{ line }}</li>
          </ul>
        </article>
      </div>

      <hr class="discount-divider-line" />

      <h2 class="discount-section-title">{{ discountText.notesTitle }}</h2>

      <h3 class="discount-note-title">{{ discountText.problemTitle }}</h3>
      <ul class="discount-note-list">
        <li v-for="(line, idx) in splitLines(discountText.problemBody)" :key="`problem-${idx}`">{{ line }}</li>
      </ul>

      <h3 class="discount-note-title">{{ discountText.documentTitle }}</h3>
      <ul class="discount-note-list">
        <li v-for="(line, idx) in splitLines(discountText.documentBody)" :key="`document-${idx}`">{{ line }}</li>
      </ul>
    </section>

    <SiteFooter />
  </main>
</template>
