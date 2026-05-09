import { deleteObject, ref as storageRef } from 'firebase/storage'

/**
 * Firebase Storage 다운로드 URL(gs/https)인지 판별합니다.
 * 로컬 정적 경로(/assets/...)는 삭제 대상이 아닙니다.
 */
export function isDeletableStorageUrl(url) {
  const s = String(url || '').trim()
  if (!s || s.startsWith('/')) return false
  if (s.startsWith('blob:') || s.startsWith('data:')) return false
  if (s.startsWith('gs://')) return true
  if (!/^https?:\/\//i.test(s)) return false
  return (
    s.includes('firebasestorage.googleapis.com') ||
    (s.includes('storage.googleapis.com') && s.includes('/o/'))
  )
}

/**
 * Storage 객체 삭제를 시도합니다. 로컬 URL이면 noop, 실패해도 throw 하지 않습니다.
 */
export async function deleteStorageObjectByUrl(storage, url) {
  if (!storage || !isDeletableStorageUrl(url)) return
  try {
    await deleteObject(storageRef(storage, url))
  } catch {
    // not-found, 권한, 잘못된 URL 등 — UI 흐름은 유지
  }
}

export async function deleteStorageUrls(storage, urls) {
  if (!storage || !Array.isArray(urls) || !urls.length) return
  const unique = [...new Set(urls.map((u) => String(u || '').trim()).filter(Boolean))]
  await Promise.all(unique.map((u) => deleteStorageObjectByUrl(storage, u)))
}
