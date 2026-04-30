import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { lightProducts } from '../src/data/lightData.js'

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

  for (const item of lightProducts) {
    const payload = {
      category: 'light',
      section: item.section || 'LIGHT',
      name: item.name || '',
      brand: item.brand || '',
      originalPrice: Number(item.originalPrice || 0),
      discountPrice: Number(item.discountPrice || 0),
      mainImage: item.image || '',
      images: item.image ? [item.image] : [],
      accessories: Array.isArray(item.accessories) ? item.accessories : [],
      baseComponents: Array.isArray(item.baseComponents) ? item.baseComponents : [],
      options: Array.isArray(item.options) ? item.options : [],
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(collection(db, 'product'), item.id), payload, { merge: true })
    console.log(`[OK] light / ${item.id}`)
  }

  console.log(`Light seed complete: ${lightProducts.length} items`)
}

run().catch((error) => {
  console.error('Light seed failed:', error?.message || error)
  process.exit(1)
})
