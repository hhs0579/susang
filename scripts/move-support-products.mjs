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
const SUPPORT_SECTIONS = new Set(['WIRELESS FOCUS', 'MATTEBOX', 'FILTER'])

function normalizeSection(value) {
  return String(value || '')
    .toUpperCase()
    .replaceAll(' ', '')
}

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
  let movedCount = 0
  let skippedCount = 0

  for (const entry of snapshot.docs) {
    const data = entry.data()
    const section = normalizeSection(data.section)
    if (!SUPPORT_SECTIONS.has(section)) {
      skippedCount += 1
      continue
    }
    if (String(data.category || '').toLowerCase() === 'support') {
      skippedCount += 1
      continue
    }

    await updateDoc(entry.ref, {
      category: 'support',
      updatedAt: serverTimestamp(),
    })
    movedCount += 1
    console.log(`[MOVE] ${entry.id} -> support (section: ${data.section || ''})`)
  }

  console.log(`Move complete. moved=${movedCount}, skipped=${skippedCount}`)
}

run().catch((error) => {
  console.error('Move failed:', error?.message || error)
  process.exit(1)
})
