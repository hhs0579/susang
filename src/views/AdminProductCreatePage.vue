<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, firestoreDatabaseId, hasRequiredConfig, storage } from '../firebase'
import { useContentStore } from '../stores/contentStore'

const { state: contentState } = useContentStore()
const CATEGORY_OPTIONS = computed(() =>
  Array.isArray(contentState.taxonomyCategories) && contentState.taxonomyCategories.length
    ? contentState.taxonomyCategories
    : ['camera', 'lens', 'support', 'grip', 'monitor', 'intercom', 'light', 'set'],
)
const SECTION_OPTIONS_BY_CATEGORY = computed(
  () => contentState.taxonomySectionsByCategory || {},
)

const isSaving = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  category: 'camera',
  section: 'CAMERA',
  name: '',
  brand: '',
  originalPrice: 0,
  discountPrice: 0,
  baseComponentsText: '',
  optionsText: '',
  images: [],
})

const sectionOptions = computed(() => SECTION_OPTIONS_BY_CATEGORY.value[form.category] || [])

watch(
  () => form.category,
  (category) => {
    const options = SECTION_OPTIONS_BY_CATEGORY.value[category] || []
    if (!options.length) return
    if (!options.includes(form.section)) {
      form.section = options[0]
    }
  },
  { immediate: true },
)

function resetForm() {
  form.category = 'camera'
  form.section = 'CAMERA'
  form.name = ''
  form.brand = ''
  form.originalPrice = 0
  form.discountPrice = 0
  form.baseComponentsText = ''
  form.optionsText = ''
  form.images = []
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
  return {
    category: form.category,
    section: form.section.trim(),
    name: form.name.trim(),
    brand: form.brand.trim(),
    originalPrice: Number(form.originalPrice || 0),
    discountPrice: Number(form.discountPrice || 0),
    baseComponents: parseBaseComponents(),
    options: parseOptions(),
    images: [...form.images],
    mainImage: form.images[0] || '',
    order: Date.now(),
    createdAt: serverTimestamp(),
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
  successMessage.value = ''
  try {
    await addDoc(collection(db, 'product'), buildPayload())
    successMessage.value = '상품이 등록되었습니다.'
    resetForm()
  } catch (error) {
    errorMessage.value = error?.message || '상품 등록에 실패했습니다.'
  } finally {
    isSaving.value = false
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
  if (!window.confirm('이미지를 삭제할까요?')) return
  form.images = form.images.filter((_, idx) => idx !== index)
}
</script>

<template>
  <main class="admin-dashboard">
    <header class="admin-header">
      <h1>상품 추가하기</h1>
      <div class="admin-header-actions">
        <RouterLink to="/admin/dashboard">상품 관리로 돌아가기</RouterLink>
      </div>
    </header>

    <section class="admin-section">
      <h2>신규 상품 등록</h2>
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
        <label class="admin-label">세부 카테고리</label>
        <select v-model="form.section">
          <option v-for="section in sectionOptions" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
        <label class="admin-label">상품명</label>
        <input v-model="form.name" type="text" placeholder="예: CANON C400" />
        <label class="admin-label">브랜드</label>
        <input v-model="form.brand" type="text" placeholder="예: CANON" />
        <label class="admin-label">원가(숫자만)</label>
        <input
          v-model.number="form.originalPrice"
          type="number"
          min="0"
          placeholder="예: 70000"
          @wheel.prevent
        />
        <label class="admin-label">할인가(숫자만)</label>
        <input
          v-model.number="form.discountPrice"
          type="number"
          min="0"
          placeholder="예: 70000"
          @wheel.prevent
        />
        <label class="admin-label">기본 구성품</label>
        <textarea
          v-model="form.baseComponentsText"
          rows="5"
          placeholder="한 줄에 하나씩 입력&#10;예:&#10;CANON C400&#10;CFExpress Type B 1TB x 3ea&#10;CANON Charger x 1ea (요청시)"
        ></textarea>
        <label class="admin-label">옵션 (없으면 비워도 됨)</label>
        <textarea
          v-model="form.optionsText"
          rows="8"
          placeholder="한 줄 형식: 그룹명: 옵션1, 옵션2, 옵션3&#10;예:&#10;Cage Setup (Single, Y): CANON C400 V-Mount Cage +0, CANON C400 Body +0"
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
          <button type="submit" :disabled="isSaving || isUploading">상품 추가하기</button>
          <button type="button" @click="resetForm">초기화</button>
        </div>
      </form>
      <p v-if="successMessage" class="admin-success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }} (db: {{ firestoreDatabaseId }})</p>
    </section>
  </main>
</template>
