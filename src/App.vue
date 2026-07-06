<template>
  <RouterView v-slot="{ Component, route }">
    <KeepAlive>
      <component :is="Component" v-if="route.meta.keepAlive" :key="route.name" />
    </KeepAlive>
    <component :is="Component" v-if="!route.meta.keepAlive" :key="route.fullPath" />
  </RouterView>
  <a
    v-if="!isAdminRoute"
    href="http://pf.kakao.com/_xbxcxhhK"
    target="_blank"
    rel="noreferrer"
    class="guide-float-inquiry"
    aria-label="예약 문의"
  >
    <img src="/assets/images/icon5.png" alt="" class="guide-float-icon" />
    <span>예약 문의</span>
  </a>
  <transition v-if="!isAdminRoute" name="splash-fade">
    <div v-if="isSplashVisible" class="global-splash">
      <video
        ref="splashVideoRef"
        class="global-splash-video"
        autoplay
        muted
        playsinline
        preload="auto"
      >
        <source src="/splash.mp4" type="video/mp4" />
      </video>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from './firebase'
import { isFirebaseStorageUrl, prewarmRemoteImage } from './utils/runtimeImageCache'
import {
  collectThumbUrlsFromCategoryCache,
  warmAllCategoryProductCaches,
} from './composables/useCategoryProducts'

const isSplashVisible = ref(true)
const splashVideoRef = ref(null)
const route = useRoute()
const isAdminRoute = computed(() => String(route.path || '').startsWith('/admin'))

const MIN_SPLASH_MS = 700
const SPLASH_PREWARM_BUDGET_MS = 2800
const SPLASH_PREWARM_LIMIT = 96
const SPLASH_PREWARM_PER_CATEGORY = 14
const BACKGROUND_PREWARM_FETCH_LIMIT = 800
const BACKGROUND_PREWARM_BATCH_SIZE = 16
const BACKGROUND_PREWARM_DELAY_MS = 120
const PRIORITY_CATEGORIES = ['set', 'camera', 'lens', 'grip', 'monitor', 'light', 'intercom', 'support']
const splashWarmedUrls = new Set()

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitForSplashVideoEnd(timeoutMs = 15000) {
  const video = splashVideoRef.value
  if (!video) return Promise.resolve()
  if (video.ended) return Promise.resolve()

  return new Promise((resolve) => {
    const cleanup = () => {
      video.removeEventListener('ended', onDone)
      video.removeEventListener('error', onDone)
      clearTimeout(timer)
    }
    const onDone = () => {
      cleanup()
      resolve()
    }
    const timer = setTimeout(onDone, timeoutMs)
    video.addEventListener('ended', onDone, { once: true })
    video.addEventListener('error', onDone, { once: true })
  })
}

function getProductThumbUrl(data) {
  const thumbFromArray = Array.isArray(data.thumbImages) ? data.thumbImages[0] : ''
  return String(thumbFromArray || data.thumbImage || '').trim()
}

async function collectFirestoreThumbUrls(fetchLimit = 320) {
  if (!db || typeof Image === 'undefined') return
  const snap = await getDocs(query(collection(db, 'product'), limit(fetchLimit)))
  const urlsByCategory = new Map()
  for (const doc of snap.docs) {
    const data = doc.data() || {}
    const category = String(data.category || '').trim().toLowerCase()
    const firstImage = getProductThumbUrl(data)
    if (!firstImage || !isFirebaseStorageUrl(firstImage) || splashWarmedUrls.has(firstImage)) continue
    if (!urlsByCategory.has(category)) urlsByCategory.set(category, [])
    const bucket = urlsByCategory.get(category)
    if (bucket.length >= SPLASH_PREWARM_PER_CATEGORY) continue
    bucket.push(firstImage)
  }

  const orderedBuckets = [
    ...PRIORITY_CATEGORIES.map((category) => urlsByCategory.get(category) || []),
    ...[...urlsByCategory.entries()]
      .filter(([category]) => !PRIORITY_CATEGORIES.includes(category))
      .map(([, bucket]) => bucket),
  ].filter((bucket) => bucket.length)

  return orderedBuckets
}

async function prewarmFirestoreThumbsOnSplash() {
  const orderedBuckets = await collectFirestoreThumbUrls(320)
  if (!orderedBuckets || !orderedBuckets.length) return

  const picked = []
  let cursor = 0
  while (picked.length < SPLASH_PREWARM_LIMIT && orderedBuckets.some((bucket) => bucket.length > cursor)) {
    for (const bucket of orderedBuckets) {
      if (picked.length >= SPLASH_PREWARM_LIMIT) break
      const url = bucket[cursor]
      if (!url || splashWarmedUrls.has(url)) continue
      splashWarmedUrls.add(url)
      picked.push(url)
    }
    cursor += 1
  }

  await Promise.all(
    picked.map(
      (url) => prewarmRemoteImage(url),
    ),
  )
}

function scheduleIdleTask(task) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => task())
    return
  }
  setTimeout(task, 0)
}

async function continuePrewarmFirestoreThumbsInBackground() {
  const orderedBuckets = await collectFirestoreThumbUrls(BACKGROUND_PREWARM_FETCH_LIMIT)
  if (!orderedBuckets || !orderedBuckets.length) return

  const queue = []
  let cursor = 0
  while (orderedBuckets.some((bucket) => bucket.length > cursor)) {
    for (const bucket of orderedBuckets) {
      const url = bucket[cursor]
      if (!url || splashWarmedUrls.has(url)) continue
      splashWarmedUrls.add(url)
      queue.push(url)
    }
    cursor += 1
  }
  if (!queue.length) return

  const runBatch = async (startIndex) => {
    const batch = queue.slice(startIndex, startIndex + BACKGROUND_PREWARM_BATCH_SIZE)
    if (!batch.length) return
    await Promise.all(
      batch.map(
        (url) => prewarmRemoteImage(url),
      ),
    )

    const nextIndex = startIndex + BACKGROUND_PREWARM_BATCH_SIZE
    if (nextIndex < queue.length) {
      setTimeout(() => {
        scheduleIdleTask(() => {
          runBatch(nextIndex)
        })
      }, BACKGROUND_PREWARM_DELAY_MS)
    }
  }

  scheduleIdleTask(() => {
    runBatch(0)
  })
}

/** 카테고리 캐시가 채워진 뒤 해당 카테고리 썸네일 추가 프리워밍 (스플래시와 별개) */
function prewarmCategoryCacheThumbsInBackground() {
  const orderedBuckets = collectThumbUrlsFromCategoryCache(48)
  if (!orderedBuckets.length) return

  const queue = []
  let cursor = 0
  while (orderedBuckets.some((bucket) => bucket.length > cursor)) {
    for (const bucket of orderedBuckets) {
      const url = bucket[cursor]
      if (!url || splashWarmedUrls.has(url) || !isFirebaseStorageUrl(url)) continue
      splashWarmedUrls.add(url)
      queue.push(url)
    }
    cursor += 1
  }
  if (!queue.length) return

  scheduleIdleTask(() => {
    Promise.all(queue.map((url) => prewarmRemoteImage(url)))
  })
}

async function showSplashUntilReady() {
  if (isAdminRoute.value) {
    isSplashVisible.value = false
    return
  }
  isSplashVisible.value = true
  const startedAt = Date.now()

  await nextTick()
  const waitVideoPromise = waitForSplashVideoEnd()
  const prewarmPromise = !isAdminRoute.value ? prewarmFirestoreThumbsOnSplash() : Promise.resolve()
  await Promise.race([prewarmPromise, delay(SPLASH_PREWARM_BUDGET_MS)])
  await waitVideoPromise

  const elapsed = Date.now() - startedAt
  if (elapsed < MIN_SPLASH_MS) {
    await delay(MIN_SPLASH_MS - elapsed)
  }
  isSplashVisible.value = false
}

onMounted(async () => {
  if (!isAdminRoute.value) {
    warmAllCategoryProductCaches()
  }
  await showSplashUntilReady()
  if (!isAdminRoute.value) {
    continuePrewarmFirestoreThumbsInBackground()
    prewarmCategoryCacheThumbsInBackground()
    setTimeout(prewarmCategoryCacheThumbsInBackground, 2000)
  }
})
</script>
