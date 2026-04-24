import { initializeApp } from 'firebase/app'
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app, process.env.VITE_FIREBASE_DATABASE_ID || '(default)')

const sampleProduct = {
  category: 'camera',
  section: 'CAMERA',
  name: 'SAMPLE CAMERA PRODUCT',
  brand: 'SUSANG',
  originalPrice: 100000,
  discountPrice: 80000,
  images: ['/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA 35 FULL SET.jpg'],
  mainImage: '/assets/images/homepage_img/01_Camera/01_Camera Full Set/ARRI ALEXA 35 FULL SET.jpg',
  accessories: [],
  baseComponents: ['Sample Body x 1ea', 'Battery x 2ea'],
  options: [{ group: 'Mount (Single, Y)', items: ['PL +0', 'EF +10,000'] }],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
}

const docRef = await addDoc(collection(db, 'product'), sampleProduct)
console.log(`Seed product created: ${docRef.id}`)
