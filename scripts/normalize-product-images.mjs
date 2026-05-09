import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore'

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
const dryRun = String(process.env.DRY_RUN || '').trim() === '1'
const targetCategory = String(process.env.TARGET_CATEGORY || '').trim().toLowerCase()

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, databaseId)
const auth = getAuth(app)

function toCleanUrlArray(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []
  for (const raw of value) {
    const url = String(raw || '').trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    result.push(url)
  }
  return result
}

function isSameArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정')
  }

  const snapshot = await getDocs(collection(db, 'product'))
  let scanned = 0
  let updated = 0
  let skipped = 0

  for (const entry of snapshot.docs) {
    scanned += 1
    const data = entry.data() || {}
    const category = String(data.category || '').trim().toLowerCase()
    if (targetCategory && category !== targetCategory) {
      skipped += 1
      continue
    }

    const existingImages = toCleanUrlArray(data.images)
    const existingMainImage = String(data.mainImage || '').trim()
    const fallbackMain = String(data.image || '').trim()

    const normalizedImages = existingImages.length
      ? existingImages
      : existingMainImage
        ? [existingMainImage]
        : fallbackMain
          ? [fallbackMain]
          : []

    const normalizedMain = normalizedImages[0] || ''
    const normalizedAccessories = normalizedImages.slice(1)

    const existingAccessories = toCleanUrlArray(data.accessories)
    const needsUpdate =
      !isSameArray(existingImages, normalizedImages) ||
      existingMainImage !== normalizedMain ||
      !isSameArray(existingAccessories, normalizedAccessories)

    if (!needsUpdate) {
      skipped += 1
      continue
    }

    if (dryRun) {
      console.log(
        `[DRY-RUN] ${entry.id} (${category || 'unknown'}) images:${existingImages.length}->${normalizedImages.length}`,
      )
      updated += 1
      continue
    }

    await updateDoc(entry.ref, {
      images: normalizedImages,
      mainImage: normalizedMain,
      image: normalizedMain,
      accessories: normalizedAccessories,
      updatedAt: serverTimestamp(),
    })
    updated += 1
    console.log(`[UPDATE] ${entry.id} (${category || 'unknown'})`)
  }

  console.log(
    `Normalize product images complete. scanned=${scanned}, updated=${updated}, skipped=${skipped}, dryRun=${dryRun}`,
  )
}

run().catch((error) => {
  console.error('Failed:', error?.message || error)
  process.exit(1)
})
