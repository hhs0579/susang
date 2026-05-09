import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore'

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

const TARGET_IDS = ['full-field-diopter', 'wormhole-138mm']

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, databaseId)
const auth = getAuth(app)

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정')
  }

  let updated = 0
  for (const id of TARGET_IDS) {
    const ref = doc(db, 'product', id)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      console.log(`[SKIP] ${id} (not found)`)
      continue
    }

    const data = snap.data()
    const original = Number(data.originalPrice || 0)
    await updateDoc(ref, {
      baseComponents: [],
      discountPrice: original,
      updatedAt: serverTimestamp(),
    })
    updated += 1
    console.log(`[UPDATE] ${id} → baseComponents=[], discountPrice=${original}`)
  }

  console.log(`Done. updated=${updated}`)
}

run().catch((error) => {
  console.error('Failed:', error?.message || error)
  process.exit(1)
})
