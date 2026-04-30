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
const EXCLUDED_CATEGORIES = new Set(['set', 'lens'])

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
  let changedCount = 0
  let skippedCount = 0

  for (const entry of snapshot.docs) {
    const data = entry.data()
    const category = String(data.category || '').toLowerCase()
    const originalPrice = Number(data.originalPrice || 0)
    const discountPrice = Number(data.discountPrice || 0)

    if (EXCLUDED_CATEGORIES.has(category)) {
      skippedCount += 1
      continue
    }

    if (discountPrice === originalPrice) {
      skippedCount += 1
      continue
    }

    await updateDoc(entry.ref, {
      discountPrice: originalPrice,
      updatedAt: serverTimestamp(),
    })
    changedCount += 1
    console.log(`[UPDATE] ${category} / ${entry.id} : ${discountPrice} -> ${originalPrice}`)
  }

  console.log(`Normalize complete. updated=${changedCount}, skipped=${skippedCount}`)
}

run().catch((error) => {
  console.error('Normalize failed:', error?.message || error)
  process.exit(1)
})
