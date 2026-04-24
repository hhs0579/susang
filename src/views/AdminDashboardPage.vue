<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { ADMIN_SESSION_KEY } from '../router'
import { auth, db, firestoreDatabaseId, hasRequiredConfig, storage } from '../firebase'

const router = useRouter()
const CATEGORY_OPTIONS = ['camera', 'lens', 'grip', 'monitor', 'intercom', 'light', 'set']

const products = ref([])
const loading = ref(true)
const isSaving = ref(false)
const isUploading = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const selectedId = ref('')

const form = reactive({
  category: 'camera',
  section: '',
  name: '',
  brand: '',
  originalPrice: 0,
  discountPrice: 0,
  baseComponentsText: '',
  optionsText: '',
  images: [],
})

const selectedProduct = computed(() => products.value.find((item) => item.id === selectedId.value))
const groupedProducts = computed(() => {
  const grouped = CATEGORY_OPTIONS.map((category) => ({
    category,
    items: products.value.filter((item) => (item.category || 'etc') === category),
  })).filter((group) => group.items.length > 0)

  const extras = products.value.filter((item) => !CATEGORY_OPTIONS.includes(item.category))
  if (extras.length) grouped.push({ category: 'etc', items: extras })

  return grouped
})

onMounted(() => {
  if (!db) {
    errorMessage.value = 'Firebase 설정이 없어 관리자 상품 관리를 사용할 수 없습니다.'
    loading.value = false
    return
  }

  const unsubscribe = onSnapshot(
    collection(db, 'product'),
    (snapshot) => {
      products.value = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      loading.value = false
    },
    (error) => {
      errorMessage.value = error?.message || '상품 목록을 불러오지 못했습니다.'
      loading.value = false
    },
  )

  onUnmounted(() => unsubscribe())
})

function resetForm() {
  selectedId.value = ''
  form.category = 'camera'
  form.section = ''
  form.name = ''
  form.brand = ''
  form.originalPrice = 0
  form.discountPrice = 0
  form.baseComponentsText = ''
  form.optionsText = ''
  form.images = []
}

function editProduct(item) {
  selectedId.value = item.id
  form.category = item.category || 'camera'
  form.section = item.section || ''
  form.name = item.name || ''
  form.brand = item.brand || ''
  form.originalPrice = Number(item.originalPrice || 0)
  form.discountPrice = Number(item.discountPrice || 0)
  form.baseComponentsText = Array.isArray(item.baseComponents) ? item.baseComponents.join('\n') : ''
  form.optionsText = Array.isArray(item.options)
    ? item.options.map((entry) => `${entry.group}: ${Array.isArray(entry.items) ? entry.items.join(', ') : ''}`).join('\n')
    : ''
  form.images = Array.isArray(item.images) ? [...item.images] : item.mainImage ? [item.mainImage] : []
}

function parseBaseComponents() {
  return form.baseComponentsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseOptions() {
  if (!form.optionsText.trim()) return []
  return form.optionsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [groupPart, itemsPart = ''] = line.split(':')
      const items = itemsPart
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      return {
        group: (groupPart || '').trim(),
        items,
      }
    })
    .filter((entry) => entry.group)
}

function buildPayload() {
  const options = parseOptions()
  return {
    category: form.category,
    section: form.section.trim(),
    name: form.name.trim(),
    brand: form.brand.trim(),
    originalPrice: Number(form.originalPrice || 0),
    discountPrice: Number(form.discountPrice || 0),
    baseComponents: parseBaseComponents(),
    options,
    images: [...form.images],
    mainImage: form.images[0] || '',
    updatedAt: serverTimestamp(),
  }
}

async function saveProduct() {
  if (!db) return
  if (!form.name.trim()) {
    errorMessage.value = '상품명은 필수입니다.'
    return
  }
  if (!form.images.length) {
    errorMessage.value = '대표 이미지를 최소 1개 이상 넣어주세요.'
    return
  }

  isSaving.value = true
  errorMessage.value = ''
  try {
    const payload = buildPayload()
    if (selectedProduct.value) {
      await updateDoc(doc(db, 'product', selectedProduct.value.id), payload)
    } else {
      await addDoc(collection(db, 'product'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
    }
    resetForm()
  } catch (error) {
    errorMessage.value = error?.message || '상품 저장에 실패했습니다.'
  } finally {
    isSaving.value = false
  }
}

async function removeProduct(id) {
  if (!db) return
  const target = products.value.find((item) => item.id === id)
  if (!target) return
  if (!window.confirm(`'${target.name}' 상품을 삭제할까요?`)) return

  isDeleting.value = true
  errorMessage.value = ''
  try {
    await deleteDoc(doc(db, 'product', id))
    const images = Array.isArray(target.images) ? target.images : []
    await Promise.all(
      images.map(async (url) => {
        try {
          await deleteObject(storageRef(storage, url))
        } catch {
          // Ignore storage cleanup failures.
        }
      }),
    )
    if (selectedId.value === id) resetForm()
  } catch (error) {
    errorMessage.value = error?.message || '상품 삭제에 실패했습니다.'
  } finally {
    isDeleting.value = false
  }
}

async function uploadImages(event) {
  if (!storage) return
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  isUploading.value = true
  errorMessage.value = ''
  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const key = `products/${Date.now()}-${file.name}`
        const fileRef = storageRef(storage, key)
        await uploadBytes(fileRef, file)
        return getDownloadURL(fileRef)
      }),
    )
    form.images = [...form.images, ...uploaded]
  } catch (error) {
    errorMessage.value = error?.message || '이미지 업로드에 실패했습니다.'
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

function removeImage(index) {
  form.images = form.images.filter((_, idx) => idx !== index)
}

async function logout() {
  try {
    await signOut(auth)
  } catch {
    // Firebase sign-out failure should not block local session cleanup.
  }
  localStorage.removeItem(ADMIN_SESSION_KEY)
  router.push('/admin')
}
</script>

<template>
  <main class="admin-dashboard">
    <header class="admin-header">
      <h1>관리자 페이지</h1>
      <div class="admin-header-actions">
        <RouterLink to="/">메인 보기</RouterLink>
        <button type="button" @click="logout">로그아웃</button>
      </div>
    </header>

    <section class="admin-section">
      <h2>상품 등록/수정</h2>
      <p class="admin-help">
        아래 항목을 순서대로 채우면 됩니다. 이미지 업로드 후 첫 번째 이미지가 대표 이미지로 사용됩니다.
      </p>
      <p v-if="!hasRequiredConfig" class="error">Firebase 환경변수 설정이 필요합니다.</p>
      <form class="admin-product-form" @submit.prevent="saveProduct">
        <label class="admin-label">카테고리</label>
        <select v-model="form.category">
          <option v-for="category in CATEGORY_OPTIONS" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
        <label class="admin-label">섹션명</label>
        <input v-model="form.section" type="text" placeholder="예: WIRELESS MONITOR, TRIPOD, CART" />
        <label class="admin-label">상품명</label>
        <input v-model="form.name" type="text" placeholder="예: TERADEK Bolt 4K LT" />
        <label class="admin-label">브랜드</label>
        <input v-model="form.brand" type="text" placeholder="예: TERADEK" />
        <label class="admin-label">원가(숫자만)</label>
        <input v-model.number="form.originalPrice" type="number" min="0" placeholder="예: 80000" />
        <label class="admin-label">할인가(숫자만)</label>
        <input v-model.number="form.discountPrice" type="number" min="0" placeholder="예: 64000" />
        <label class="admin-label">기본 구성품</label>
        <textarea
          v-model="form.baseComponentsText"
          rows="5"
          placeholder="한 줄에 하나씩 입력&#10;예:&#10;Bolt 4K LT TX x 1ea&#10;Bolt 4K LT RX x 1ea"
        ></textarea>
        <label class="admin-label">옵션 (없으면 비워도 됨)</label>
        <textarea
          v-model="form.optionsText"
          rows="8"
          placeholder="한 줄 형식: 그룹명: 옵션1, 옵션2, 옵션3&#10;예:&#10;Lens (Single, Y): PL +0, EF +10,000&#10;Cart (Multiple, N): Cine Cart +10,000, Wagon +10,000"
        ></textarea>
        <p class="admin-help">
          옵션 입력 규칙: <code>그룹명: 옵션1, 옵션2</code> 형태로 줄마다 작성하세요.
        </p>
        <label class="admin-label">상품 이미지</label>
        <div class="admin-upload-row">
          <input type="file" multiple accept="image/*" @change="uploadImages" />
          <span v-if="isUploading">업로드 중...</span>
        </div>
        <p class="admin-help">첫 번째 이미지가 대표 이미지로 사용됩니다.</p>
        <div class="admin-image-list">
          <div v-for="(image, index) in form.images" :key="`${image}-${index}`" class="admin-image-item">
            <img :src="image" alt="uploaded" />
            <button type="button" class="danger" @click="removeImage(index)">삭제</button>
          </div>
        </div>
        <div class="admin-form-actions">
          <button type="submit" :disabled="isSaving || isUploading">
            {{ selectedProduct ? '수정 저장' : '신규 추가' }}
          </button>
          <button type="button" @click="resetForm">초기화</button>
        </div>
      </form>
      <p v-if="errorMessage" class="error">{{ errorMessage }} (db: {{ firestoreDatabaseId }})</p>
    </section>

    <section class="admin-section">
      <h2>등록된 상품 관리</h2>
      <p v-if="loading">불러오는 중...</p>
      <div v-for="group in groupedProducts" :key="group.category" class="admin-category-group">
        <h3 class="admin-category-title">{{ group.category.toUpperCase() }}</h3>
        <div class="admin-list">
          <article v-for="item in group.items" :key="item.id" class="admin-item">
            <strong>{{ item.name }}</strong>
            <p>{{ item.category }} / {{ item.section }}</p>
            <p>{{ item.brand }} · ₩{{ Number(item.discountPrice || 0).toLocaleString('ko-KR') }}</p>
            <div class="admin-item-actions">
              <button type="button" @click="editProduct(item)">수정</button>
              <button type="button" class="danger" :disabled="isDeleting" @click="removeProduct(item.id)">삭제</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>
