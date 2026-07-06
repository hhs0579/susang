/**
 * siteSettings/hero 의 taxonomy·categoryItems 에 남은 「복제-lens」 등을 정리합니다.
 *
 * DRY_RUN=1 node --env-file=.env scripts/cleanup-duplicate-taxonomy.mjs
 * node --env-file=.env scripts/cleanup-duplicate-taxonomy.mjs
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

const COPY_PREFIX_RE = /^복제[-_\s]*/iu

function sanitizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(COPY_PREFIX_RE, '')
    .trim()
}

function sanitizeTaxonomyCategories(categories) {
  if (!Array.isArray(categories)) return []
  const out = []
  const seen = new Set()
  for (const raw of categories) {
    const key = sanitizeCategoryKey(raw)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

function sanitizeCategoryItems(items) {
  if (!Array.isArray(items)) return []
  const merged = new Map()
  for (const item of items) {
    const name = sanitizeCategoryKey(item?.name).toUpperCase()
    if (!name) continue
    const next = {
      id: item?.id,
      name,
      desc: String(item?.desc || '').trim(),
      imageUrl: String(item?.imageUrl || '').trim(),
    }
    const prev = merged.get(name)
    if (!prev) {
      merged.set(name, next)
      continue
    }
    merged.set(name, {
      ...prev,
      desc: prev.desc || next.desc,
      imageUrl: prev.imageUrl || next.imageUrl,
      id: prev.id != null ? prev.id : next.id,
    })
  }
  return [...merged.values()]
}

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
const dryRun = process.env.DRY_RUN === '1'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, databaseId)
const auth = getAuth(app)

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정')
  }

  const ref = doc(db, 'siteSettings', 'hero')
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    console.log('[SKIP] siteSettings/hero 문서 없음')
    return
  }

  const data = snap.data()
  const nextTaxonomy = sanitizeTaxonomyCategories(data.taxonomyCategories)
  const nextCategoryItems = sanitizeCategoryItems(data.categoryItems)

  console.log('[BEFORE] taxonomy:', data.taxonomyCategories)
  console.log('[AFTER] taxonomy:', nextTaxonomy)
  console.log('[BEFORE] categoryItems names:', (data.categoryItems || []).map((i) => i?.name))
  console.log('[AFTER] categoryItems names:', nextCategoryItems.map((i) => i?.name))

  if (dryRun) {
    console.log('[DRY_RUN] 저장하지 않음')
    return
  }

  await setDoc(
    ref,
    {
      taxonomyCategories: nextTaxonomy,
      categoryItems: nextCategoryItems,
      updatedAt: Date.now(),
    },
    { merge: true },
  )
  console.log('[OK] siteSettings/hero 정리 완료')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
