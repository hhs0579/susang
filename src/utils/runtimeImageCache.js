const remoteBlobUrlBySource = new Map()
const pendingRemoteLoads = new Map()
const REMOTE_PATTERN = /^https?:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//

function isFirebaseStorageUrl(value) {
  return REMOTE_PATTERN.test(String(value || ''))
}

async function loadRemoteAsBlobUrl(url) {
  const src = String(url || '').trim()
  if (!src || !isFirebaseStorageUrl(src) || typeof window === 'undefined') return src
  if (remoteBlobUrlBySource.has(src)) return remoteBlobUrlBySource.get(src)
  if (pendingRemoteLoads.has(src)) return pendingRemoteLoads.get(src)

  const pending = (async () => {
    try {
      const response = await fetch(src, { mode: 'cors', cache: 'force-cache' })
      if (!response.ok) return src
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      remoteBlobUrlBySource.set(src, blobUrl)
      return blobUrl
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

export { isFirebaseStorageUrl, loadRemoteAsBlobUrl, prewarmRemoteImage, getCachedRemoteBlobUrl }
