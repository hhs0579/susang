<template>
  <RouterView />
  <a
    href="http://pf.kakao.com/_xbxcxhhK"
    target="_blank"
    rel="noreferrer"
    class="guide-float-inquiry"
    aria-label="예약 문의"
  >
    <img src="/assets/images/icon5.png" alt="" class="guide-float-icon" />
    <span>예약 문의</span>
  </a>
  <transition name="splash-fade">
    <div v-if="isSplashVisible" class="global-splash">
      <img src="/assets/images/logo2.png" alt="SUSANG" class="global-splash-logo" />
    </div>
  </transition>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'

const isSplashVisible = ref(true)

const MIN_SPLASH_MS = 700

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCurrentImages() {
  const images = Array.from(document.querySelectorAll('img'))
  const pending = images.filter((img) => !img.complete)
  if (!pending.length) return

  await Promise.all(
    pending.map(
      (img) =>
        new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true })
          img.addEventListener('error', resolve, { once: true })
        }),
    ),
  )
}

async function showSplashUntilReady() {
  isSplashVisible.value = true
  const startedAt = Date.now()

  await nextTick()
  await waitForCurrentImages()

  const elapsed = Date.now() - startedAt
  if (elapsed < MIN_SPLASH_MS) {
    await delay(MIN_SPLASH_MS - elapsed)
  }
  isSplashVisible.value = false
}

onMounted(async () => {
  await showSplashUntilReady()
})
</script>
