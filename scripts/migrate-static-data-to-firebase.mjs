import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from 'firebase/storage'
import { cameraProducts } from '../src/data/cameraData.js'
import { lensProducts } from '../src/data/lensData.js'
import { gripProducts } from '../src/data/gripData.js'
import { monitorProducts } from '../src/data/monitorData.js'
import { intercomProducts } from '../src/data/intercomData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const publicDir = path.join(rootDir, 'public')

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
const storage = getStorage(app)
const auth = getAuth(app)

function getCategoryProducts() {
  return [
    ['camera', cameraProducts],
    ['lens', lensProducts],
    ['grip', gripProducts],
    ['monitor', monitorProducts],
    ['intercom', intercomProducts],
  ]
}

function toStorageSafeSegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-_./]/g, '-')
    .replace(/-+/g, '-')
}

async function uploadAssetFromPublic(assetPath, category, productId, index) {
  if (!assetPath || !assetPath.startsWith('/assets/')) return assetPath

  const relativeAssetPath = assetPath.slice(1)
  const absoluteAssetPath = path.join(publicDir, relativeAssetPath.replace(/^assets\//, 'assets/'))

  try {
    const buffer = await fs.readFile(absoluteAssetPath)
    const ext = path.extname(relativeAssetPath) || '.jpg'
    const storagePath = `products/${toStorageSafeSegment(category)}/${toStorageSafeSegment(productId)}/${index}${ext}`
    const fileRef = storageRef(storage, storagePath)
    await uploadBytes(fileRef, buffer)
    return await getDownloadURL(fileRef)
  } catch (error) {
    console.warn(`[WARN] Image upload skipped: ${assetPath} (${error?.message || 'read/upload failed'})`)
    return assetPath
  }
}

async function migrateProduct(category, product) {
  const imageList = [product.image, ...(product.accessories || [])].filter(Boolean)
  const uploadedImages = []
  for (let idx = 0; idx < imageList.length; idx += 1) {
    const uploaded = await uploadAssetFromPublic(imageList[idx], category, product.id, idx)
    uploadedImages.push(uploaded)
  }

  const payload = {
    category,
    section: product.section || category.toUpperCase(),
    name: product.name || '',
    brand: product.brand || '',
    originalPrice: Number(product.originalPrice || 0),
    discountPrice: Number(product.discountPrice || 0),
    mainImage: uploadedImages[0] || product.image || '',
    images: uploadedImages,
    accessories: uploadedImages.slice(1),
    baseComponents: Array.isArray(product.baseComponents) ? product.baseComponents : [],
    options: Array.isArray(product.options) ? product.options : [],
    updatedAt: serverTimestamp(),
  }

  const targetRef = doc(collection(db, 'product'), product.id)
  await setDoc(targetRef, payload, { merge: true })
}

async function run() {
  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정. Firestore/Storage write 권한이 필요합니다.')
  }

  for (const [category, products] of getCategoryProducts()) {
    for (const product of products) {
      await migrateProduct(category, product)
      console.log(`[OK] ${category} / ${product.id}`)
    }
  }

  console.log('Migration complete')
}

run().catch((error) => {
  console.error('Migration failed:', error?.message || error)
  process.exit(1)
})
