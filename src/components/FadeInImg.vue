<script setup>
import { ref, watch } from 'vue'
import { getCachedRemoteBlobUrl, isFirebaseStorageUrl, loadRemoteAsBlobUrl } from '../utils/runtimeImageCache'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  imgClass: { type: [String, Array, Object], default: '' },
})

const resolvedSrc = ref('')

async function syncResolvedSrc(nextSrc) {
  const target = String(nextSrc || '').trim()
  if (!target) {
    resolvedSrc.value = ''
    return
  }

  if (!isFirebaseStorageUrl(target)) {
    // 로컬(/assets 등)은 즉시 반영해 지연 체감을 제거
    resolvedSrc.value = target
    return
  }

  const cached = getCachedRemoteBlobUrl(target)
  if (cached) {
    resolvedSrc.value = cached
    return
  }

  // 캐시가 없으면 우선 원본 URL로 즉시 표시하고, 백그라운드에서 blob 캐시 생성
  resolvedSrc.value = target
  const blobUrl = await loadRemoteAsBlobUrl(target)
  if (target === String(props.src || '').trim() && blobUrl && blobUrl !== target) {
    resolvedSrc.value = blobUrl
  }
}

watch(
  () => props.src,
  (nextSrc) => {
    syncResolvedSrc(nextSrc)
  },
  { immediate: true },
)

</script>

<template>
  <img :src="resolvedSrc || src" :alt="alt" :class="imgClass" />
</template>

