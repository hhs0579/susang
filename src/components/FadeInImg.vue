<script setup>
import { ref, watch } from 'vue'
import {
  getCachedRemoteBlobUrl,
  isFirebaseStorageUrl,
  loadRemoteAsBlobUrl,
  resolveDisplayImageUrl,
} from '../utils/runtimeImageCache'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  imgClass: { type: [String, Array, Object], default: '' },
})

const resolvedSrc = ref(resolveDisplayImageUrl(props.src))

async function syncResolvedSrc(nextSrc) {
  const target = String(nextSrc || '').trim()
  if (!target) {
    resolvedSrc.value = ''
    return
  }

  if (!isFirebaseStorageUrl(target)) {
    resolvedSrc.value = target
    return
  }

  const cached = getCachedRemoteBlobUrl(target)
  if (cached) {
    resolvedSrc.value = cached
    return
  }

  const blobUrl = await loadRemoteAsBlobUrl(target)
  if (target === String(props.src || '').trim()) {
    resolvedSrc.value = blobUrl || target
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
  <img v-bind="$attrs" :src="resolvedSrc || src" :alt="alt" :class="imgClass" />
</template>

