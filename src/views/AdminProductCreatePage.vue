<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, firestoreDatabaseId, hasRequiredConfig, storage } from '../firebase'
import { useContentStore } from '../stores/contentStore'
import { parseOptionsFromText } from '../utils/productOptionsAdmin.js'
import { isDiscountPriceLockedCategory } from '../composables/useCategoryProducts'
import { resolveProductSlug } from '../utils/productSlug'
import { deleteStorageObjectByUrl } from '../utils/storageDelete.js'

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
const THUMB_MAX_WIDTH = 480

const form = reactive({
  category: 'camera',
  section: 'CAMERA',
  subSections: [],
  name: '',
  brand: '',
  originalPrice: 0,
  discountPrice: 0,
  priceDisplayText: '',
  titleExtraText: '',
  detailFooterText: '',
  detailFooterImages: [],
  baseComponentsText: '',
  optionsText: '',
  images: [],
  thumbImages: [],
  optionOnlyPricing: false,
})

const sectionOptions = computed(() => SECTION_OPTIONS_BY_CATEGORY.value[form.category] || [])
const subSectionOptions = computed(() => sectionOptions.value.filter((section) => section !== form.section))
const isDiscountLocked = computed(() => isDiscountPriceLockedCategory(form.category))

watch(
  () => form.category,
  (category) => {
    const options = SECTION_OPTIONS_BY_CATEGORY.value[category] || []
    if (!options.length) return
    if (!options.includes(form.section)) {
      form.section = options[0]
    }
    form.subSections = form.subSections.filter((s) => options.includes(s) && s !== form.section)
  },
  { immediate: true },
)
watch(
  () => form.section,
  (section) => {
    form.subSections = form.subSections.filter((s) => s !== section)
  },
)
watch(
  () => [form.category, form.originalPrice],
  ([category, original]) => {
    if (isDiscountPriceLockedCategory(category)) {
      form.discountPrice = Number(original || 0)
    }
  },
  { immediate: true },
)
watch(
  () => form.optionOnlyPricing,
  (enabled) => {
    if (enabled) {
      form.originalPrice = 0
      form.discountPrice = 0
    }
  },
  { immediate: true },
)

function resetForm() {
  form.category = 'camera'
  form.section = contentState.taxonomySectionsByCategory?.camera?.[0] || ''
  form.subSections = []
  form.name = ''
  form.brand = ''
  form.originalPrice = 0
  form.discountPrice = 0
  form.priceDisplayText = ''
  form.titleExtraText = ''
  form.detailFooterText = ''
  form.detailFooterImages = []
  form.baseComponentsText = ''
  form.optionsText = ''
  form.images = []
  form.thumbImages = []
  form.optionOnlyPricing = false
}

function parseBaseComponents() {
  return form.baseComponentsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function fileNameWithoutExt(name = '') {
  return String(name).replace(/\.[^.]+$/, '')
}

async function createThumbBlob(file, maxWidth = THUMB_MAX_WIDTH) {
  if (typeof window === 'undefined' || !window.createImageBitmap) return file
  const bitmap = await window.createImageBitmap(file)
  const ratio = bitmap.width > 0 ? Math.min(1, maxWidth / bitmap.width) : 1
  const width = Math.max(1, Math.round(bitmap.width * ratio))
  const height = Math.max(1, Math.round(bitmap.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return await new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('썸네일 생성에 실패했습니다.'))
      },
      'image/webp',
      0.8,
    )
  })
}

function buildPayload() {
  const subSections = [...new Set(form.subSections.map((s) => String(s || '').trim()).filter(Boolean))].filter(
    (s) => s !== form.section,
  )
  const imageUrls = [...form.images].map((u) => String(u || '').trim()).filter(Boolean)
  const thumbUrls = [...form.thumbImages].map((u) => String(u || '').trim()).filter(Boolean)
  return {
    category: form.category,
    section: form.section.trim(),
    subSections,
    name: form.name.trim(),
    slug: resolveProductSlug({ name: form.name }),
    brand: form.brand.trim(),
    originalPrice: form.optionOnlyPricing ? 0 : Number(form.originalPrice || 0),
    discountPrice: form.optionOnlyPricing
      ? 0
      : isDiscountPriceLockedCategory(form.category)
        ? Number(form.originalPrice || 0)
        : Number(form.discountPrice || 0),
    priceDisplayText: form.priceDisplayText.trim(),
    titleExtraText: form.titleExtraText.trim(),
    detailFooterText: form.detailFooterText.trim(),
    detailFooterImages: [...form.detailFooterImages],
    baseComponents: parseBaseComponents(),
    options: parseOptionsFromText(form.optionsText),
    images: imageUrls,
    mainImage: imageUrls[0] || '',
    thumbImages: thumbUrls,
    thumbImage: thumbUrls[0] || imageUrls[0] || '',
    accessories: [],
    optionOnlyPricing: !!form.optionOnlyPricing,
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
        const imageUrl = await getDownloadURL(fileRef)
        const thumbBlob = await createThumbBlob(file)
        const thumbKey = `products/thumbs/${Date.now()}-${fileNameWithoutExt(file.name)}.webp`
        const thumbRef = storageRef(storage, thumbKey)
        await uploadBytes(thumbRef, thumbBlob)
        const thumbUrl = await getDownloadURL(thumbRef)
        return { imageUrl, thumbUrl }
      }),
    )
    form.images = [...form.images, ...uploaded.map((item) => item.imageUrl)]
    form.thumbImages = [...form.thumbImages, ...uploaded.map((item) => item.thumbUrl)]
  } catch (error) {
    errorMessage.value = error?.message || '이미지 업로드에 실패했습니다.'
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

async function removeImage(index) {
  if (!window.confirm('이미지를 삭제할까요?')) return
  const url = form.images[index]
  const thumbUrl = form.thumbImages[index]
  form.images = form.images.filter((_, idx) => idx !== index)
  form.thumbImages = form.thumbImages.filter((_, idx) => idx !== index)
  await deleteStorageObjectByUrl(storage, url)
  if (thumbUrl && thumbUrl !== url) await deleteStorageObjectByUrl(storage, thumbUrl)
}

async function uploadDetailFooterImages(event) {
  if (!storage) return
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  isUploading.value = true
  errorMessage.value = ''
  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const key = `products/detail-footer/${Date.now()}-${file.name}`
        const fileRef = storageRef(storage, key)
        await uploadBytes(fileRef, file)
        return getDownloadURL(fileRef)
      }),
    )
    form.detailFooterImages = [...form.detailFooterImages, ...uploaded]
  } catch (error) {
    errorMessage.value = error?.message || '하단 이미지 업로드에 실패했습니다.'
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

async function removeDetailFooterImage(index) {
  if (!window.confirm('이미지를 삭제할까요?')) return
  const url = form.detailFooterImages[index]
  form.detailFooterImages = form.detailFooterImages.filter((_, idx) => idx !== index)
  await deleteStorageObjectByUrl(storage, url)
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
        <label class="admin-label">중복 세부 카테고리 (복수 선택)</label>
        <div class="admin-check-grid">
          <label v-for="section in subSectionOptions" :key="section" class="admin-check-item">
            <input v-model="form.subSections" type="checkbox" :value="section" />
            <span>{{ section }}</span>
          </label>
          <p v-if="!subSectionOptions.length" class="admin-help">추가로 선택 가능한 세부 카테고리가 없습니다.</p>
        </div>
        <label class="admin-label">상품명</label>
        <input v-model="form.name" type="text" placeholder="예: CANON C400" />
        <label class="admin-label">브랜드</label>
        <input v-model="form.brand" type="text" placeholder="예: CANON" />
        <label class="admin-check-item admin-option-only-toggle">
          <input v-model="form.optionOnlyPricing" type="checkbox" />
          <span>옵션가로만 판매 (원가·할인가는 사용하지 않음, 기본 구성품은 표시용으로 입력 가능)</span>
        </label>
        <label class="admin-label">원가(숫자만)</label>
        <input
          v-model.number="form.originalPrice"
          type="number"
          min="0"
          placeholder="예: 70000"
          :disabled="form.optionOnlyPricing"
          @wheel.prevent
        />
        <label class="admin-label">할인가(숫자만)</label>
        <input
          v-model.number="form.discountPrice"
          type="number"
          min="0"
          placeholder="예: 70000"
          :disabled="isDiscountLocked || form.optionOnlyPricing"
          @wheel.prevent
        />
        <p v-if="isDiscountLocked" class="admin-help">
          서포트 카테고리는 할인가를 제공하지 않으므로 정상가와 동일한 값으로 자동 저장됩니다.
        </p>
        <p class="admin-help">
          ‘0원 시작 + 옵션가로 합산’ 상품(예: 필터)은 이 옵션을 켜면 원가/할인가가 0으로 저장됩니다.
          옵션 줄에 <code>옵션명 +가격</code> 형태로 입력하면 상세에서 선택 시 금액이 더해집니다.
          구성 설명은 <strong>기본 구성품</strong>에 넣어도 됩니다(표시용).
        </p>
        <label class="admin-label">가격 표시 문구(선택)</label>
        <input v-model="form.priceDisplayText" type="text" placeholder="예: 카메라 대여시 무료" />
        <label class="admin-label">제목 추가문구(선택)</label>
        <input v-model="form.titleExtraText" type="text" placeholder="예: 풀패키지" />
        <label class="admin-label">상세 하단 추가 텍스트(선택)</label>
        <textarea
          v-model="form.detailFooterText"
          rows="4"
          placeholder="상세 우측 하단(가격/복사 영역 아래)에 표시할 안내 문구를 입력하세요"
        ></textarea>
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
          placeholder="그룹명: 옵션1, 옵션2&#10;*기본선택 — 싱글/멀티 모두 *로 지정 가능&#10;예: Cage (Single): *본체 +0, 풀킷 +50000"
        ></textarea>
        <p class="admin-help">
          <code>그룹명: 옵션1, 옵션2</code> 줄마다 작성합니다. 상세 기본 선택은
          <code>*옵션명</code>으로만 지정합니다(싱글·멀티 동일). *가 없으면 해당 그룹은 상세에서 비워 둡니다.
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
        <label class="admin-label">상세 하단 추가 이미지(선택)</label>
        <div class="admin-upload-row">
          <input type="file" multiple accept="image/*" @change="uploadDetailFooterImages" />
          <span v-if="isUploading">업로드 중...</span>
        </div>
        <div class="admin-image-list">
          <div v-for="(image, index) in form.detailFooterImages" :key="`detail-${image}-${index}`" class="admin-image-item">
            <img :src="image" alt="detail-footer-uploaded" />
            <button type="button" class="danger" @click="removeDetailFooterImage(index)">삭제</button>
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
