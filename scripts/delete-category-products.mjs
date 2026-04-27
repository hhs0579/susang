import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, deleteDoc, getDocs, getFirestore, query, where } from 'firebase/firestore'

const targetCategory = process.argv[2]
if (!targetCategory) {
  console.error('Usage: node --env-file=.env scripts/delete-category-products.mjs <category>')
  process.exit(1)
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

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, databaseId)
const auth = getAuth(app)

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정')
  }

  const q = query(collection(db, 'product'), where('category', '==', targetCategory))
  const snapshot = await getDocs(q)
  for (const item of snapshot.docs) {
    await deleteDoc(item.ref)
    console.log(`[DELETE] ${targetCategory} / ${item.id}`)
  }

  console.log(`Delete complete: ${snapshot.docs.length} docs`)
}

run().catch((error) => {
  console.error('Delete failed:', error?.message || error)
  process.exit(1)
})
