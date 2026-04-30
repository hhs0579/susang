<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import {
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
import { useContentStore } from '../stores/contentStore'

const router = useRouter()
const { state: contentState, updateCategoryItems, updateHeroBannerImage, saveTaxonomyConfig } = useContentStore()

function normalizeCategory(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function normalizeSectionForCategory(category, section, name = '') {
  const normalizedCategory = normalizeCategory(category)
  const rawSection = String(section || '').trim()
  if (normalizedCategory !== 'grip') return rawSection

  if (rawSection === 'GRIP / GIMBAL') {
    const upperName = String(name || '').toUpperCase()
    if (
      upperName.includes('RONIN') ||
      upperName.includes('MOVI') ||
      upperName.includes('GIMBAL') ||
      upperName.includes('EASYRIG') ||
      upperName.includes('SEGWAY')
    ) {
      return 'GIMBAL'
    }
    return 'GRIP'
  }

  return rawSection
}

const products = ref([])
const loading = ref(true)
const isSaving = ref(false)
const isUploading = ref(false)
const isDeleting = ref(false)
const isBannerUploading = ref(false)
const isCategoryImageUploading = ref(false)
const errorMessage = ref('')
const bannerMessage = ref('')
const toastMessage = ref('')
const selectedId = ref('')
const activeCategoryTab = ref('')
const activeSectionFilter = ref('ALL')
const activeAdminTab = ref('products')
const heroBannerInput = ref(contentState.heroBannerImageUrl)
const taxonomyDraftCategories = ref([])
const taxonomyActiveCategory = ref('')
const taxonomyNewCategory = ref('')
const taxonomyNewSection = ref('')
const categoryCardDraftItems = ref([])
const isCategoryCardDirty = ref(false)
let toastTimerId

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
const CATEGORY_OPTIONS = computed(() =>
  Array.isArray(contentState.taxonomyCategories) && contentState.taxonomyCategories.length
    ? contentState.taxonomyCategories
    : ['camera', 'lens', 'support', 'grip', 'monitor', 'intercom', 'light', 'set'],
)
const SECTION_OPTIONS_BY_CATEGORY = computed(
  () => contentState.taxonomySectionsByCategory || {},
)
const sectionOptions = computed(() => {
  const options = SECTION_OPTIONS_BY_CATEGORY.value[form.category] || []
  if (form.section && !options.includes(form.section)) {
    return [...options, form.section]
  }
  return options
})
const sortedCategoryItems = computed(() => [...categoryCardDraftItems.value])
const categoryTabs = computed(() => {
  const tabMap = new Map(CATEGORY_OPTIONS.value.map((category) => [category, []]))
  const etcItems = []

  products.value.forEach((item) => {
    const category = normalizeCategory(item.category)
    if (tabMap.has(category)) {
      tabMap.get(category).push(item)
    } else {
      etcItems.push(item)
    }
  })

  const tabs = CATEGORY_OPTIONS.value.map((category) => ({
    key: category,
    label: category.toUpperCase(),
    items: tabMap.get(category),
  }))

  if (etcItems.length) {
    tabs.push({
      key: 'etc',
      label: 'ETC',
      items: etcItems,
    })
  }

  return tabs
})
const activeTabProducts = computed(() => categoryTabs.value.find((tab) => tab.key === activeCategoryTab.value)?.items || [])
const isBrandFilterCategory = computed(
  () => activeCategoryTab.value === 'camera' || activeCategoryTab.value === 'set',
)
const filterLabel = computed(() => (isBrandFilterCategory.value ? '브랜드 필터' : '세부 카테고리 필터'))
const availableSectionFilters = computed(() => {
  const sourceValues = isBrandFilterCategory.value
    ? activeTabProducts.value.map((item) => String(item.brand || '').trim())
    : activeTabProducts.value.map((item) => String(item.section || '').trim())
  const unique = new Set(sourceValues.filter(Boolean))
  return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
})
const filteredTabProducts = computed(() => {
  if (activeSectionFilter.value === 'ALL') return activeTabProducts.value
  if (isBrandFilterCategory.value) {
    return activeTabProducts.value.filter(
      (item) => String(item.brand || '').trim() === activeSectionFilter.value,
    )
  }
  return activeTabProducts.value.filter((item) => String(item.section || '').trim() === activeSectionFilter.value)
})

watch(
  categoryTabs,
  (tabs) => {
    if (!tabs.length) return
    if (!tabs.some((tab) => tab.key === activeCategoryTab.value)) {
      activeCategoryTab.value = tabs[0].key
    }
  },
  { immediate: true },
)

watch(
  [() => contentState.taxonomyCategories, () => contentState.taxonomySectionsByCategory],
  ([categories, sectionsByCategory]) => {
    const normalized = (categories || []).map((category) => {
      const key = normalizeCategory(category)
      return {
        key,
        sections: [...(sectionsByCategory?.[key] || [])],
      }
    })
    taxonomyDraftCategories.value = normalized
    if (!normalized.some((item) => item.key === taxonomyActiveCategory.value)) {
      taxonomyActiveCategory.value = normalized[0]?.key || ''
    }
  },
  { immediate: true, deep: true },
)

watch(
  () => contentState.categoryItems,
  (items) => {
    if (isCategoryCardDirty.value) return
    categoryCardDraftItems.value = (items || []).map((item) => ({ ...item }))
  },
  { immediate: true, deep: true },
)

watch(
  [activeCategoryTab, availableSectionFilters],
  () => {
    if (!availableSectionFilters.value.includes(activeSectionFilter.value)) {
      activeSectionFilter.value = 'ALL'
    }
  },
  { immediate: true },
)

watch(
  () => contentState.heroBannerImageUrl,
  (value) => {
    heroBannerInput.value = value
  },
)

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
        .sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
          const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
          if (aOrder !== bOrder) return aOrder - bOrder
          return (a.name || '').localeCompare(b.name || '')
        })
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
  form.section = 'CAMERA'
  form.name = ''
  form.brand = ''
  form.originalPrice = 0
  form.discountPrice = 0
  form.baseComponentsText = ''
  form.optionsText = ''
  form.images = []
}

const activeTaxonomyDraft = computed(
  () => taxonomyDraftCategories.value.find((item) => item.key === taxonomyActiveCategory.value) || null,
)

function addTaxonomyCategory() {
  const key = normalizeCategory(taxonomyNewCategory.value)
  if (!key) return
  if (taxonomyDraftCategories.value.some((item) => item.key === key)) {
    taxonomyNewCategory.value = ''
    return
  }
  taxonomyDraftCategories.value.push({ key, sections: [key.toUpperCase()] })
  taxonomyActiveCategory.value = key
  taxonomyNewCategory.value = ''
}

function removeTaxonomyCategory(categoryKey) {
  if (!window.confirm('카테고리를 삭제할까요?')) return
  taxonomyDraftCategories.value = taxonomyDraftCategories.value.filter((item) => item.key !== categoryKey)
  if (taxonomyActiveCategory.value === categoryKey) {
    taxonomyActiveCategory.value = taxonomyDraftCategories.value[0]?.key || ''
  }
}

function moveTaxonomyCategory(index, direction) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= taxonomyDraftCategories.value.length) return
  const next = [...taxonomyDraftCategories.value]
  const temp = next[index]
  next[index] = next[nextIndex]
  next[nextIndex] = temp
  taxonomyDraftCategories.value = next
}

function addTaxonomySection() {
  const target = activeTaxonomyDraft.value
  if (!target) return
  const section = String(taxonomyNewSection.value || '').trim()
  if (!section) return
  if (!target.sections.includes(section)) {
    target.sections.push(section)
  }
  taxonomyNewSection.value = ''
}

function removeTaxonomySection(section) {
  if (!window.confirm('세부 카테고리를 삭제할까요?')) return
  const target = activeTaxonomyDraft.value
  if (!target) return
  target.sections = target.sections.filter((item) => item !== section)
}

function saveTaxonomySettings() {
  const categories = taxonomyDraftCategories.value.map((item) => item.key)
  if (!categories.length) {
    errorMessage.value = '카테고리는 최소 1개 이상 필요합니다.'
    return
  }
  const sectionsByCategory = {}
  taxonomyDraftCategories.value.forEach((item) => {
    const sections = item.sections.map((section) => String(section || '').trim()).filter(Boolean)
    sectionsByCategory[item.key] = sections.length ? sections : [item.key.toUpperCase()]
  })
  saveTaxonomyConfig(categories, sectionsByCategory)
  bannerMessage.value = '카테고리/세부카테고리 설정이 저장되었습니다.'
  showToast('카테고리 설정이 저장되었습니다.')
}

function moveCategoryItem(index, direction) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= categoryCardDraftItems.value.length) return
  const nextItems = [...categoryCardDraftItems.value]
  const temp = nextItems[index]
  nextItems[index] = nextItems[nextIndex]
  nextItems[nextIndex] = temp
  categoryCardDraftItems.value = nextItems
  isCategoryCardDirty.value = true
}

async function uploadCategoryImage(event, id) {
  if (!storage) return
  const file = Array.from(event.target.files || [])[0]
  if (!file) return
  isCategoryImageUploading.value = true
  errorMessage.value = ''
  try {
    const key = `products/categories/${Date.now()}-${file.name}`
    const fileRef = storageRef(storage, key)
    await uploadBytes(fileRef, file)
    const downloadUrl = await getDownloadURL(fileRef)
    const nextItems = categoryCardDraftItems.value.map((item) =>
      item.id === id ? { ...item, imageUrl: downloadUrl } : item,
    )
    categoryCardDraftItems.value = nextItems
    isCategoryCardDirty.value = true
  } catch (error) {
    errorMessage.value = error?.message || '카테고리 이미지 업로드에 실패했습니다.'
  } finally {
    isCategoryImageUploading.value = false
    event.target.value = ''
  }
}

function updateCategoryImageInput(id, imageUrl) {
  const nextItems = categoryCardDraftItems.value.map((item) =>
    item.id === id ? { ...item, imageUrl } : item,
  )
  categoryCardDraftItems.value = nextItems
  isCategoryCardDirty.value = true
}

function updateCategoryDescInput(id, desc) {
  const nextItems = categoryCardDraftItems.value.map((item) =>
    item.id === id ? { ...item, desc } : item,
  )
  categoryCardDraftItems.value = nextItems
  isCategoryCardDirty.value = true
}

function saveCategoryCardSettings() {
  updateCategoryItems(categoryCardDraftItems.value)
  isCategoryCardDirty.value = false
  bannerMessage.value = '카테고리 카드 설정이 저장되었습니다.'
  showToast('카테고리 카드 설정이 저장되었습니다.')
}

function resetCategoryCardSettings() {
  categoryCardDraftItems.value = (contentState.categoryItems || []).map((item) => ({ ...item }))
  isCategoryCardDirty.value = false
}

async function moveProductOrder(item, direction) {
  if (!db) return
  const list = filteredTabProducts.value
  const index = list.findIndex((entry) => entry.id === item.id)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return
  const current = list[index]
  const target = list[targetIndex]
  const currentOrder = Number.isFinite(Number(current.order)) ? Number(current.order) : index
  const targetOrder = Number.isFinite(Number(target.order)) ? Number(target.order) : targetIndex
  await Promise.all([
    updateDoc(doc(db, 'product', current.id), { order: targetOrder, updatedAt: serverTimestamp() }),
    updateDoc(doc(db, 'product', target.id), { order: currentOrder, updatedAt: serverTimestamp() }),
  ])
}

function editProduct(item) {
  selectedId.value = item.id
  form.category = normalizeCategory(item.category) || 'camera'
  form.section = normalizeSectionForCategory(form.category, item.section, item.name)
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
    category: normalizeCategory(form.category),
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
    if (!selectedProduct.value) {
      errorMessage.value = '신규 상품은 "상품 추가하기" 페이지에서 등록해주세요.'
      return
    }
    await updateDoc(doc(db, 'product', selectedProduct.value.id), payload)
    resetForm()
    showToast('상품 수정이 저장되었습니다.')
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
  if (!window.confirm('이미지를 삭제할까요?')) return
  form.images = form.images.filter((_, idx) => idx !== index)
}

function saveHeroBanner() {
  updateHeroBannerImage(heroBannerInput.value.trim())
  bannerMessage.value = '메인 배너가 저장되었습니다.'
  showToast('메인 배너가 저장되었습니다.')
}

function resetHeroBanner() {
  updateHeroBannerImage('/assets/images/main1.png')
  bannerMessage.value = '기본 배너로 복원했습니다.'
}

async function uploadHeroBanner(event) {
  if (!storage) return
  const file = Array.from(event.target.files || [])[0]
  if (!file) return

  isBannerUploading.value = true
  bannerMessage.value = ''
  try {
    const key = `products/banners/${Date.now()}-${file.name}`
    const fileRef = storageRef(storage, key)
    await uploadBytes(fileRef, file)
    const downloadUrl = await getDownloadURL(fileRef)
    heroBannerInput.value = downloadUrl
    updateHeroBannerImage(downloadUrl)
    bannerMessage.value = '배너 이미지가 업로드되었습니다.'
  } catch (error) {
    bannerMessage.value = error?.message || '배너 업로드에 실패했습니다.'
  } finally {
    isBannerUploading.value = false
    event.target.value = ''
  }
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

function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimerId)
  toastTimerId = setTimeout(() => {
    toastMessage.value = ''
  }, 1800)
}
</script>

<template>
  <main class="admin-dashboard">
    <header class="admin-header">
      <h1>관리자 페이지</h1>
      <div class="admin-header-actions">
        <RouterLink to="/admin/products/new" class="admin-add-button">상품 추가하기</RouterLink>
        <RouterLink to="/">메인 보기</RouterLink>
        <button type="button" @click="logout">로그아웃</button>
      </div>
    </header>

    <div class="admin-tabs admin-page-tabs">
      <button
        type="button"
        class="admin-tab-button"
        :class="{ active: activeAdminTab === 'products' }"
        @click="activeAdminTab = 'products'"
      >
        상품 관리
      </button>
      <button
        type="button"
        class="admin-tab-button"
        :class="{ active: activeAdminTab === 'taxonomy' }"
        @click="activeAdminTab = 'taxonomy'"
      >
        카테고리 설정
      </button>
      <button
        type="button"
        class="admin-tab-button"
        :class="{ active: activeAdminTab === 'banner' }"
        @click="activeAdminTab = 'banner'"
      >
        배너 관리
      </button>
    </div>

    <section v-show="activeAdminTab === 'banner'" class="admin-section admin-banner-section">
      <h2>메인 첫 배너 관리</h2>
      <p class="admin-help">홈 메인 페이지 첫 번째 배너 이미지를 교체할 수 있습니다.</p>
      <img :src="contentState.heroBannerImageUrl" alt="메인 배너 미리보기" class="admin-hero-preview" />
      <label class="admin-label">배너 이미지 URL</label>
      <input v-model="heroBannerInput" type="text" placeholder="https://..." />
      <div class="admin-upload-row">
        <input type="file" accept="image/*" @change="uploadHeroBanner" />
        <span v-if="isBannerUploading">업로드 중...</span>
      </div>
      <div class="admin-form-actions">
        <button type="button" @click="saveHeroBanner">배너 저장</button>
        <button type="button" @click="resetHeroBanner">기본 이미지로 복원</button>
      </div>
      <p v-if="bannerMessage" class="admin-help">{{ bannerMessage }}</p>
    </section>

    <section v-show="activeAdminTab === 'taxonomy'" class="admin-section">
      <h2>카테고리/세부카테고리 설정</h2>
      <p class="admin-help">입력 후 추가 버튼만 누르면 됩니다. 규칙 입력 없이 쉽게 관리할 수 있습니다.</p>
      <div class="taxonomy-manager">
        <div class="taxonomy-column">
          <label class="admin-label">카테고리</label>
          <div class="taxonomy-input-row">
            <input
              v-model="taxonomyNewCategory"
              type="text"
              placeholder="예: lens"
              @keydown.enter.prevent="addTaxonomyCategory"
            />
            <button type="button" @click="addTaxonomyCategory">추가</button>
          </div>
          <div class="taxonomy-chip-list">
            <button
              v-for="(category, index) in taxonomyDraftCategories"
              :key="category.key"
              type="button"
              class="taxonomy-chip"
              :class="{ active: taxonomyActiveCategory === category.key }"
              @click="taxonomyActiveCategory = category.key"
            >
              {{ category.key }}
            </button>
          </div>
          <div v-if="activeTaxonomyDraft" class="admin-item-actions">
            <button
              type="button"
              @click="
                moveTaxonomyCategory(
                  taxonomyDraftCategories.findIndex((item) => item.key === taxonomyActiveCategory),
                  -1,
                )
              "
            >
              위로
            </button>
            <button
              type="button"
              @click="
                moveTaxonomyCategory(
                  taxonomyDraftCategories.findIndex((item) => item.key === taxonomyActiveCategory),
                  1,
                )
              "
            >
              아래로
            </button>
            <button type="button" class="danger" @click="removeTaxonomyCategory(taxonomyActiveCategory)">삭제</button>
          </div>
        </div>
        <div class="taxonomy-column">
          <label class="admin-label">세부 카테고리 ({{ taxonomyActiveCategory || '-' }})</label>
          <div class="taxonomy-input-row">
            <input
              v-model="taxonomyNewSection"
              type="text"
              placeholder="예: PRIME LENS"
              :disabled="!activeTaxonomyDraft"
              @keydown.enter.prevent="addTaxonomySection"
            />
            <button type="button" :disabled="!activeTaxonomyDraft" @click="addTaxonomySection">추가</button>
          </div>
          <div class="taxonomy-chip-list">
            <span v-if="!activeTaxonomyDraft" class="admin-help">왼쪽에서 카테고리를 먼저 선택하세요.</span>
            <span
              v-for="section in activeTaxonomyDraft?.sections || []"
              :key="section"
              class="taxonomy-tag"
            >
              {{ section }}
              <button type="button" @click="removeTaxonomySection(section)">×</button>
            </span>
          </div>
        </div>
      </div>
      <div class="admin-form-actions taxonomy-save-actions">
        <button type="button" @click="saveTaxonomySettings">카테고리 설정 저장</button>
      </div>
    </section>

    <section v-show="activeAdminTab === 'banner'" class="admin-section">
      <h2>메인 카테고리 카드 관리</h2>
      <p class="admin-help">카테고리 카드 순서/이미지/설명을 변경할 수 있습니다.</p>
      <div class="admin-list">
        <article v-for="(item, index) in sortedCategoryItems" :key="item.id" class="admin-item">
          <strong>{{ item.name }}</strong>
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            alt="category"
            style="width: 120px; height: 68px; object-fit: cover; border-radius: 8px"
          />
          <input
            :value="item.imageUrl"
            type="text"
            placeholder="카테고리 이미지 URL"
            @change="updateCategoryImageInput(item.id, $event.target.value)"
          />
          <input
            :value="item.desc"
            type="text"
            placeholder="카테고리 설명"
            @change="updateCategoryDescInput(item.id, $event.target.value)"
          />
          <div class="admin-item-actions category-card-actions">
            <input type="file" accept="image/*" @change="uploadCategoryImage($event, item.id)" />
            <button type="button" @click="moveCategoryItem(index, -1)">위로</button>
            <button type="button" @click="moveCategoryItem(index, 1)">아래로</button>
          </div>
        </article>
      </div>
      <p v-if="isCategoryImageUploading" class="admin-help">카테고리 이미지 업로드 중...</p>
      <div class="admin-form-actions">
        <button type="button" :disabled="!isCategoryCardDirty" @click="saveCategoryCardSettings">카테고리 카드 저장</button>
        <button type="button" :disabled="!isCategoryCardDirty" @click="resetCategoryCardSettings">변경 취소</button>
      </div>
    </section>

    <section v-show="activeAdminTab === 'products'" class="admin-section">
      <h2>상품 수정</h2>
      <p class="admin-help">
        선택한 상품 정보를 수정할 수 있습니다. 신규 상품은 상단 "상품 추가하기" 버튼에서 등록할 수 있습니다.
      </p>
      <p v-if="!selectedProduct" class="admin-help">먼저 상품 관리 탭에서 상품을 선택해주세요.</p>
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
          <button type="submit" :disabled="isSaving || isUploading || !selectedProduct">수정 저장</button>
          <button type="button" @click="resetForm">초기화</button>
        </div>
      </form>
    </section>

    <section v-show="activeAdminTab === 'products'" class="admin-section">
      <h2>등록된 상품 관리</h2>
      <p v-if="loading">불러오는 중...</p>
      <div v-if="categoryTabs.length" class="admin-tabs">
        <button
          v-for="tab in categoryTabs"
          :key="tab.key"
          type="button"
          class="admin-tab-button"
          :class="{ active: activeCategoryTab === tab.key }"
          @click="activeCategoryTab = tab.key"
        >
          {{ tab.label }} ({{ tab.items.length }})
        </button>
      </div>
      <div v-if="activeTabProducts.length" class="admin-filter-row">
        <span class="admin-label">{{ filterLabel }}</span>
        <div class="admin-tabs">
          <button
            v-for="section in availableSectionFilters"
            :key="section"
            type="button"
            class="admin-tab-button"
            :class="{ active: activeSectionFilter === section }"
            @click="activeSectionFilter = section"
          >
            {{ section === 'ALL' ? '전체' : section }}
          </button>
        </div>
      </div>
      <div v-if="filteredTabProducts.length" class="admin-list">
        <article v-for="item in filteredTabProducts" :key="item.id" class="admin-item">
          <strong>{{ item.name }}</strong>
          <p>{{ item.category }} / {{ item.section }}</p>
          <p>{{ item.brand }} · ₩{{ Number(item.discountPrice || 0).toLocaleString('ko-KR') }}</p>
          <div class="admin-item-actions">
            <button type="button" @click="editProduct(item)">수정</button>
            <button type="button" @click="moveProductOrder(item, -1)">위로</button>
            <button type="button" @click="moveProductOrder(item, 1)">아래로</button>
            <button type="button" class="danger" :disabled="isDeleting" @click="removeProduct(item.id)">삭제</button>
          </div>
        </article>
      </div>
      <p v-else-if="!loading" class="admin-help">
        선택한 조건에 맞는 상품이 없습니다.
      </p>
      <p v-if="selectedProduct" class="admin-help">
        현재 선택된 상품: <strong>{{ selectedProduct.name }}</strong>
      </p>
      <p v-else class="admin-help">
        수정할 상품을 목록에서 먼저 선택해주세요.
      </p>
      <p v-if="errorMessage" class="error">{{ errorMessage }} (db: {{ firestoreDatabaseId }})</p>
    </section>

    <div
      v-if="toastMessage"
      style="
        position: fixed;
        left: 50%;
        bottom: 26px;
        transform: translateX(-50%);
        z-index: 2500;
        background: rgba(0, 0, 0, 0.86);
        color: #fff;
        padding: 10px 16px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: -0.01em;
      "
    >
      {{ toastMessage }}
    </div>
  </main>
</template>
