import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, getStorage, uploadBytes, ref as storageRef } from 'firebase/storage'
import sharp from 'sharp'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || '(default)'
const adminEmail = process.env.FIREBASE_ADMIN_EMAIL || ''
const adminPassword = process.env.FIREBASE_ADMIN_PASSWORD || ''

// 환경 변수로 한 번에 처리할 개수·카테고리 제어 가능
const BATCH_LIMIT = Number(process.env.THUMB_BACKFILL_LIMIT || '200')
const TARGET_CATEGORY = String(process.env.THUMB_BACKFILL_CATEGORY || '').trim().toLowerCase()
const THUMB_MAX_WIDTH = Number(process.env.THUMB_MAX_WIDTH || '480')
const FORCE = String(process.env.FORCE || '').trim() === '1'
const DELETE_OLD = String(process.env.DELETE_OLD || '').trim() !== '0'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, databaseId)
const auth = getAuth(app)
const storage = getStorage(app)

function isFirebaseStorageUrl(value) {
  return /^https?:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//.test(String(value || ''))
}

function storagePathFromDownloadUrl(downloadUrl) {
  try {
    const u = new URL(String(downloadUrl || ''))
    const m = u.pathname.match(/\/o\/([^/]+)$/)
    if (!m) return null
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}

async function deleteThumbByUrl(url) {
  const path = storagePathFromDownloadUrl(url)
  if (!path) return
  // 안전장치: thumbs 경로만 삭제
  if (!path.startsWith('products/thumbs/')) return
  await deleteObject(storageRef(storage, path))
}

async function fetchImageBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패: ${res.status} ${res.statusText}`)
  }
  const arr = await res.arrayBuffer()
  return Buffer.from(arr)
}

async function createThumbBuffer(buffer) {
  return sharp(buffer)
    .resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()
}

function pickPrimaryImage(data) {
  const images = Array.isArray(data.images) ? data.images : []
  const main = String(data.mainImage || data.image || images[0] || '').trim()
  if (main && isFirebaseStorageUrl(main)) return main
  // 로컬 에셋(/assets/...)은 그대로 두고, Firestorage URL만 처리
  return null
}

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정 — 클라이언트 권한으로만 시도합니다.')
  }

  const snap = await getDocs(query(collection(db, 'product'), limit(BATCH_LIMIT)))
  let scanned = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const docSnap of snap.docs) {
    scanned += 1
    const data = docSnap.data() || {}
    const category = String(data.category || '').trim().toLowerCase()
    if (TARGET_CATEGORY && category !== TARGET_CATEGORY) {
      skipped += 1
      continue
    }

    const hasThumb =
      (Array.isArray(data.thumbImages) && data.thumbImages.length > 0) ||
      String(data.thumbImage || '').trim().length > 0
    if (hasThumb && !FORCE) {
      skipped += 1
      continue
    }

    const primaryUrl = pickPrimaryImage(data)
    if (!primaryUrl) {
      skipped += 1
      continue
    }

    try {
      if (hasThumb && FORCE && DELETE_OLD) {
        const oldList = Array.isArray(data.thumbImages) ? data.thumbImages : []
        const oldMain = String(data.thumbImage || '').trim()
        const targets = [
          ...oldList.map((v) => String(v || '').trim()).filter(Boolean),
          ...(oldMain ? [oldMain] : []),
        ]
        for (const u of targets) {
          if (!u || !isFirebaseStorageUrl(u)) continue
          try {
            await deleteThumbByUrl(u)
          } catch (e) {
            console.warn(`[WARN] delete old thumb failed: ${docSnap.id}`, e?.message || e)
          }
        }
      }

      const original = await fetchImageBuffer(primaryUrl)
      const thumbBuf = await createThumbBuffer(original)
      const keyBase = `products/thumbs/backfill-${docSnap.id}-${Date.now()}`
      const thumbRef = storageRef(storage, `${keyBase}.webp`)
      await uploadBytes(thumbRef, thumbBuf, { contentType: 'image/webp' })
      const thumbUrl = await getDownloadURL(thumbRef)

      await updateDoc(docSnap.ref, {
        thumbImages: [thumbUrl],
        thumbImage: thumbUrl,
        updatedAt: serverTimestamp(),
      })
      updated += 1
      console.log(`[THUMB] ${docSnap.id} (${category || 'unknown'}) => ${thumbUrl}`)
    } catch (err) {
      failed += 1
      console.error(`[ERROR] ${docSnap.id}:`, err?.message || err)
    }
  }

  console.log(
    `Backfill thumbnails done. scanned=${scanned}, updated=${updated}, skipped=${skipped}, failed=${failed}, category=${
      TARGET_CATEGORY || 'ALL'
    }`,
  )
}

run().catch((err) => {
  console.error('Fatal error:', err?.message || err)
  process.exit(1)
})

