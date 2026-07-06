const remoteBlobUrlBySource = new Map()
const pendingRemoteLoads = new Map()
const PERSISTENT_CACHE_NAME = 'susang-product-images-v1'
const REMOTE_PATTERN = /^https?:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//

function isFirebaseStorageUrl(value) {
  return REMOTE_PATTERN.test(String(value || ''))
}

async function readPersistentResponse(url) {
  if (typeof caches === 'undefined') return null
  try {
    const cache = await caches.open(PERSISTENT_CACHE_NAME)
    return cache.match(url)
  } catch {
    return null
  }
}

async function writePersistentResponse(url, response) {
  if (typeof caches === 'undefined' || !response) return
  try {
    const cache = await caches.open(PERSISTENT_CACHE_NAME)
    await cache.put(url, response.clone())
  } catch {
    // 용량 초과 등 — 네트워크 표시는 계속 가능
  }
}

async function blobUrlFromResponse(src, response) {
  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(blob)
  remoteBlobUrlBySource.set(src, blobUrl)
  return blobUrl
}

async function loadRemoteAsBlobUrl(url) {
  const src = String(url || '').trim()
  if (!src || !isFirebaseStorageUrl(src) || typeof window === 'undefined') return src
  if (remoteBlobUrlBySource.has(src)) return remoteBlobUrlBySource.get(src)
  if (pendingRemoteLoads.has(src)) return pendingRemoteLoads.get(src)

  const pending = (async () => {
    try {
      const cachedResponse = await readPersistentResponse(src)
      if (cachedResponse) {
        return blobUrlFromResponse(src, cachedResponse)
      }

      const response = await fetch(src, { mode: 'cors', cache: 'force-cache' })
      if (!response.ok) return src

      void writePersistentResponse(src, response)
      return blobUrlFromResponse(src, response)
    } catch {
      return src
    } finally {
      pendingRemoteLoads.delete(src)
    }
  })()

  pendingRemoteLoads.set(src, pending)
  return pending
}

function prewarmRemoteImage(url) {
  const src = String(url || '').trim()
  if (!src || !isFirebaseStorageUrl(src)) return Promise.resolve(src)
  return loadRemoteAsBlobUrl(src)
}

function getCachedRemoteBlobUrl(url) {
  const src = String(url || '').trim()
  return remoteBlobUrlBySource.get(src) || ''
}

/** Firebase URL이면 blob 캐시(있을 때)를, 아니면 원본 경로를 즉시 반환 */
function resolveDisplayImageUrl(url) {
  const src = String(url || '').trim()
  if (!src) return ''
  if (!isFirebaseStorageUrl(src)) return src
  return getCachedRemoteBlobUrl(src) || src
}

export {
  isFirebaseStorageUrl,
  loadRemoteAsBlobUrl,
  prewarmRemoteImage,
  getCachedRemoteBlobUrl,
  resolveDisplayImageUrl,
}
