import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { collection, getDocs, getFirestore, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'

const GIMBAL_KEYWORDS = ['RONIN', 'MOVI', 'GIMBAL', 'EASYRIG', 'SEGWAY']

function inferGripSectionByName(name) {
  const upper = String(name || '').toUpperCase()
  return GIMBAL_KEYWORDS.some((keyword) => upper.includes(keyword)) ? 'GIMBAL' : 'GRIP'
}

function updateLocalGripDataFile() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const gripDataPath = path.resolve(__dirname, '../src/data/gripData.js')
  const source = fs.readFileSync(gripDataPath, 'utf8')
  const lines = source.split('\n')

  let pendingSectionLine = -1
  let updatedCount = 0

  for (let i = 0; i < lines.length; i += 1) {
    const sectionMatch = lines[i].match(/^(\s*)section:\s*'GRIP \/ GIMBAL',\s*$/)
    if (sectionMatch) {
      pendingSectionLine = i
      continue
    }

    const nameMatch = lines[i].match(/^\s*name:\s*'(.+)',\s*$/)
    if (nameMatch && pendingSectionLine >= 0) {
      const nextSection = inferGripSectionByName(nameMatch[1])
      const indent = lines[pendingSectionLine].match(/^(\s*)/)?.[1] || '    '
      lines[pendingSectionLine] = `${indent}section: '${nextSection}',`
      updatedCount += 1
      pendingSectionLine = -1
    }
  }

  fs.writeFileSync(gripDataPath, lines.join('\n'))
  return updatedCount
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

async function updateFirestoreGripSections() {
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app, databaseId)
  const auth = getAuth(app)

  if (adminEmail && adminPassword) {
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
  } else {
    console.warn('[WARN] FIREBASE_ADMIN_EMAIL / FIREBASE_ADMIN_PASSWORD 미설정')
  }

  const q = query(
    collection(db, 'product'),
    where('category', '==', 'grip'),
    where('section', '==', 'GRIP / GIMBAL'),
  )

  const snapshot = await getDocs(q)
  let changed = 0

  for (const entry of snapshot.docs) {
    const data = entry.data()
    const nextSection = inferGripSectionByName(data.name || '')
    await updateDoc(entry.ref, {
      section: nextSection,
      updatedAt: serverTimestamp(),
    })
    changed += 1
    console.log(`[UPDATE] ${entry.id}: GRIP / GIMBAL -> ${nextSection}`)
  }

  return changed
}

async function run() {
  const localUpdated = updateLocalGripDataFile()
  console.log(`Local grip data updated: ${localUpdated}`)

  const firestoreUpdated = await updateFirestoreGripSections()
  console.log(`Firestore grip docs updated: ${firestoreUpdated}`)
}

run().catch((error) => {
  console.error('Split grip sections failed:', error?.message || error)
  process.exit(1)
})
