/**
 * product 컬렉션 slug 백필 + copy-of-* 문서 ID를 slug 기반 ID로 이전
 *
 * DRY_RUN=1 node --env-file=.env scripts/fix-product-slugs.mjs
 * node --env-file=.env scripts/fix-product-slugs.mjs
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

const COPY_PREFIX_RE = /^(copy-of-|복제[-_\s]*)/iu

function slugifyName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function resolveSlug(data, docId) {
  const stored = String(data.slug || '').trim().toLowerCase()
  if (stored) return stored
  const fromName = slugifyName(data.name)
  if (fromName) return fromName
  return String(docId || '')
    .trim()
    .toLowerCase()
    .replace(COPY_PREFIX_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
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

  const snapshot = await getDocs(collection(db, 'product'))
  const usedIds = new Set(snapshot.docs.map((entry) => entry.id))
  let migrated = 0
  let slugUpdated = 0

  for (const entry of snapshot.docs) {
    const data = entry.data()
    const slug = resolveSlug(data, entry.id)
    const needsSlugField = String(data.slug || '').trim().toLowerCase() !== slug
    const needsIdMigration = COPY_PREFIX_RE.test(entry.id) && slug && slug !== entry.id

    if (!needsSlugField && !needsIdMigration) continue

    if (needsIdMigration) {
      let targetId = slug
      let suffix = 2
      while (usedIds.has(targetId) && targetId !== entry.id) {
        targetId = `${slug}-${suffix}`
        suffix += 1
      }

      if (targetId !== entry.id) {
        console.log(`[MIGRATE] ${entry.id} -> ${targetId}`)
        if (!dryRun) {
          await setDoc(
            doc(db, 'product', targetId),
            {
              ...data,
              slug: targetId,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          )
          await deleteDoc(entry.ref)
        }
        usedIds.delete(entry.id)
        usedIds.add(targetId)
        migrated += 1
        continue
      }
    }

    if (needsSlugField) {
      console.log(`[SLUG] ${entry.id} -> ${slug}`)
      if (!dryRun) {
        await setDoc(
          entry.ref,
          {
            slug,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      }
      slugUpdated += 1
    }
  }

  console.log(`[DONE] migrated=${migrated}, slugUpdated=${slugUpdated}, dryRun=${dryRun}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
