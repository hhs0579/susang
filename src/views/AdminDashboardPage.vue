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
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { ADMIN_SESSION_KEY } from '../router'
import { auth, db, firestoreDatabaseId, hasRequiredConfig, storage } from '../firebase'
import { useContentStore } from '../stores/contentStore'
import {
  mergeOptionsWithLocalFallback,
  parseOptionsFromText,
  serializeOptionsToText,
} from '../utils/productOptionsAdmin.js'
import { resolveCameraListSection, resolveSetListSection } from '../composables/useSetCameraSectionTabs.js'
import { sortAdminProducts } from '../utils/categoryListOrder.js'
import { isDiscountPriceLockedCategory } from '../composables/useCategoryProducts'
import { deleteStorageObjectByUrl, deleteStorageUrls } from '../utils/storageDelete.js'
import { sanitizeCategoryKey } from '../utils/sanitizeCategoryKey'
import { resolveProductSlug } from '../utils/productSlug'

const router = useRouter()
const {
  state: contentState,
  updateCategoryItems,
  updateHeroBannerImages,
  updateHeroBannerImagesMobile,
  updateHeroBannerText,
  updateGuideInfoCardTexts,
  updateGuideSteps,
  updateDiscountTextContent,
  updateDiscountRoundColumns,
  saveTaxonomyConfig,
} = useContentStore()

function normalizeCategory(value) {
  return sanitizeCategoryKey(value)
}

/** 목록 카드에 보이는 가격을 사이트/수정 폼과 같은 규칙으로 맞춤 (Firestore raw 값만 쓰면 어긋남) */
function adminListPriceDisplay(item) {
  const text = String(item?.priceDisplayText || '').trim()
  if (text) return text
  const orig = Number(item?.originalPrice || 0)
  const disc = Number(item?.discountPrice || 0)
  const isOptionOnly =
    !!item?.optionOnlyPricing ||
    (orig === 0 &&
      (!Array.isArray(item?.baseComponents) || item.baseComponents.length === 0) &&
      Array.isArray(item?.options) &&
      item.options.length > 0)
  if (isOptionOnly) return '옵션가로만 판매'
  if (isDiscountPriceLockedCategory(item?.category)) {
    return `₩${orig.toLocaleString('ko-KR')}`
  }
  return `₩${disc.toLocaleString('ko-KR')}`
}

/** 가격 표시 문구가 있을 때 카드에는 문구만 나가므로, 아래에 숫자 필드 값을 짧게 표시 */
function adminListPriceNumericHint(item) {
  const text = String(item?.priceDisplayText || '').trim()
  if (!text) return ''
  const orig = Number(item?.originalPrice || 0)
  const disc = Number(item?.discountPrice || 0)
  return `저장된 숫자: 정상가 ₩${orig.toLocaleString('ko-KR')} · 할인가 ₩${disc.toLocaleString('ko-KR')}`
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
const heroBannerImagesDraft = ref(Array.isArray(contentState.heroBannerImages) ? [...contentState.heroBannerImages] : [])
const heroBannerMobileInput = ref('')
const heroBannerImagesMobileDraft = ref(Array.isArray(contentState.heroBannerImagesMobile) ? [...contentState.heroBannerImagesMobile] : [])
const heroBannerTitleInput = ref(contentState.heroBannerTitle || '')
const heroBannerDescriptionInput = ref(
  Array.isArray(contentState.heroBannerDescriptionLines)
    ? contentState.heroBannerDescriptionLines.join('\n')
    : '',
)
const isBannerMobileUploading = ref(false)
const isHeroBannerMobileDraftSyncPaused = ref(false)
const isHeroBannerDraftSyncPaused = ref(false)
const bannerMobileMessage = ref('')
function normalizeGuideTitleInput(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .trim()
}
const guideInfoCardTextsInput = ref(
  Array.isArray(contentState.guideInfoCardTexts)
    ? contentState.guideInfoCardTexts.map((entry) => ({
        title: normalizeGuideTitleInput(entry?.title),
        body: String(entry?.body || ''),
        footer: String(entry?.footer || ''),
      }))
    : [],
)
const guideStepsInput = ref(
  Array.isArray(contentState.guideSteps)
    ? contentState.guideSteps.map((entry) => ({
        step: String(entry?.step || ''),
        title: String(entry?.title || ''),
        subtitle: String(entry?.subtitle || ''),
        body: String(entry?.body || ''),
        extraTitle: String(entry?.extraTitle || ''),
        extraBody: String(entry?.extraBody || ''),
      }))
    : [],
)
const discountTextContentInput = ref({ ...(contentState.discountTextContent || {}) })
const discountRoundColumnsInput = ref('')
const taxonomyDraftCategories = ref([])
const taxonomyActiveCategory = ref('')
const taxonomyActiveSection = ref('')
const taxonomyNewCategory = ref('')
const taxonomyNewSection = ref('')
const categoryCardDraftItems = ref([])
const isCategoryCardDirty = ref(false)
let toastTimerId
const THUMB_MAX_WIDTH = 480

const form = reactive({
  category: 'camera',
  section: '',
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
const subSectionOptions = computed(() => sectionOptions.value.filter((section) => section !== form.section))
const isDiscountLocked = computed(() => isDiscountPriceLockedCategory(form.category))
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

function adminProductListSection(item, categoryKey) {
  const k = normalizeCategory(categoryKey)
  if (k === 'set') return resolveSetListSection(item)
  if (k === 'camera') return resolveCameraListSection(item)
  return String(item.section || '').trim()
}

function adminProductListSections(item, categoryKey) {
  const primary = adminProductListSection(item, categoryKey)
  const extras = Array.isArray(item?.subSections)
    ? item.subSections.map((s) => String(s || '').trim()).filter(Boolean)
    : []
  return [...new Set([primary, ...extras].filter(Boolean))]
}

const filterLabel = computed(() => '세부 카테고리 필터')
const availableSectionFilters = computed(() => {
  const sourceValues = activeTabProducts.value.flatMap((item) =>
    adminProductListSections(item, activeCategoryTab.value),
  )
  const unique = new Set(sourceValues.filter(Boolean))
  return ['ALL', ...Array.from(unique).sort((a, b) => a.localeCompare(b))]
})
const filteredTabProducts = computed(() => {
  const raw =
    activeSectionFilter.value === 'ALL'
      ? activeTabProducts.value
      : activeTabProducts.value.filter(
          (item) => adminProductListSections(item, activeCategoryTab.value).includes(activeSectionFilter.value),
        )
  return sortAdminProducts(activeCategoryTab.value, activeSectionFilter.value, raw)
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
  () => contentState.heroBannerImages,
  (value) => {
    if (isHeroBannerDraftSyncPaused.value) return
    heroBannerImagesDraft.value = Array.isArray(value) ? [...value] : []
  },
  { immediate: true, deep: true },
)

watch(
  () => contentState.heroBannerImagesMobile,
  (value) => {
    if (isHeroBannerMobileDraftSyncPaused.value) return
    heroBannerImagesMobileDraft.value = Array.isArray(value) ? [...value] : []
  },
  { immediate: true, deep: true },
)
watch(
  () => contentState.heroBannerTitle,
  (value) => {
    heroBannerTitleInput.value = typeof value === 'string' ? value : String(value ?? '')
  },
  { immediate: true },
)
watch(
  () => contentState.heroBannerDescriptionLines,
  (value) => {
    heroBannerDescriptionInput.value = Array.isArray(value) ? value.join('\n') : ''
  },
  { immediate: true, deep: true },
)
watch(
  () => contentState.guideInfoCardTexts,
  (value) => {
    guideInfoCardTextsInput.value = Array.isArray(value)
      ? value.map((entry) => ({
          title: normalizeGuideTitleInput(entry?.title),
          body: String(entry?.body || ''),
          footer: String(entry?.footer || ''),
        }))
      : []
  },
  { immediate: true, deep: true },
)
watch(
  () => contentState.guideSteps,
  (value) => {
    guideStepsInput.value = Array.isArray(value)
      ? value.map((entry) => ({
          step: String(entry?.step || ''),
          title: String(entry?.title || ''),
          subtitle: String(entry?.subtitle || ''),
          body: String(entry?.body || ''),
          extraTitle: String(entry?.extraTitle || ''),
          extraBody: String(entry?.extraBody || ''),
        }))
      : []
  },
  { immediate: true, deep: true },
)
watch(
  () => contentState.discountTextContent,
  (value) => {
    discountTextContentInput.value = { ...(value || {}) }
  },
  { immediate: true, deep: true },
)
watch(
  () => contentState.discountRoundColumns,
  (value) => {
    const text = (Array.isArray(value) ? value : [])
      .map((column) =>
        (Array.isArray(column) ? column : [])
          .map((row) => `${String(row?.[0] || '').trim()} | ${String(row?.[1] || '').trim()}`)
          .filter(Boolean)
          .join('\n'),
      )
      .filter(Boolean)
      .join('\n\n')
    discountRoundColumnsInput.value = text
  },
  { immediate: true, deep: true },
)

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
watch(
  () => form.section,
  (section) => {
    form.subSections = form.subSections.filter((s) => s !== section)
  },
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

      // 자동 정리:
      //  1) 옵션가로만 판매 상품: 원가/할인가 0 (기본 구성품 문구는 유지 가능)
      //  2) 서포트 카테고리: 할인가 ≠ 정상가 인 데이터를 정상가와 동일하게 동기화
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() || {}
        const orig = Number(data.originalPrice || 0)
        const disc = Number(data.discountPrice || 0)
        const baseEmpty = !Array.isArray(data.baseComponents) || data.baseComponents.length === 0
        const hasOptions = Array.isArray(data.options) && data.options.length > 0
        const isOptionOnly = !!data.optionOnlyPricing || (orig === 0 && baseEmpty && hasOptions)

        if (isOptionOnly) {
          const updates = {}
          if (orig !== 0) updates.originalPrice = 0
          if (disc !== 0) updates.discountPrice = 0
          if (!data.optionOnlyPricing) updates.optionOnlyPricing = true
          if (Object.keys(updates).length) {
            updates.updatedAt = serverTimestamp()
            updateDoc(doc(db, 'product', docSnap.id), updates).catch((err) => {
              console.warn('[option-only auto-sync] failed:', docSnap.id, err?.message)
            })
          }
          return
        }

        if (isDiscountPriceLockedCategory(data.category) && orig > 0 && disc !== orig) {
          updateDoc(doc(db, 'product', docSnap.id), {
            discountPrice: orig,
            updatedAt: serverTimestamp(),
          }).catch((err) => {
            console.warn('[support price auto-sync] failed:', docSnap.id, err?.message)
          })
        }
      })
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

const activeTaxonomyDraft = computed(
  () => taxonomyDraftCategories.value.find((item) => item.key === taxonomyActiveCategory.value) || null,
)

const taxonomyActiveSectionIndex = computed(() => {
  const target = activeTaxonomyDraft.value
  const section = taxonomyActiveSection.value
  if (!target || !section || !Array.isArray(target.sections)) return -1
  return target.sections.indexOf(section)
})

watch(
  [taxonomyActiveCategory, taxonomyDraftCategories],
  () => {
    const sections = activeTaxonomyDraft.value?.sections
    if (!Array.isArray(sections) || !sections.length) {
      taxonomyActiveSection.value = ''
      return
    }
    if (!taxonomyActiveSection.value || !sections.includes(taxonomyActiveSection.value)) {
      taxonomyActiveSection.value = sections[0]
    }
  },
  { immediate: true, deep: true },
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
    taxonomyActiveSection.value = section
  }
  taxonomyNewSection.value = ''
}

function removeTaxonomySection(section) {
  if (!window.confirm('세부 카테고리를 삭제할까요?')) return
  const target = activeTaxonomyDraft.value
  if (!target) return
  target.sections = target.sections.filter((item) => item !== section)
}

function moveTaxonomySection(index, direction) {
  const target = activeTaxonomyDraft.value
  if (!target || !Array.isArray(target.sections)) return
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= target.sections.length) return
  const next = [...target.sections]
  const temp = next[index]
  next[index] = next[nextIndex]
  next[nextIndex] = temp
  target.sections = next
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

async function saveCategoryCardSettings() {
  errorMessage.value = ''
  try {
    await updateCategoryItems(categoryCardDraftItems.value)
    isCategoryCardDirty.value = false
    bannerMessage.value = '카테고리 카드 설정이 저장되었습니다.'
    showToast('카테고리 카드 설정이 저장되었습니다.')
  } catch (error) {
    errorMessage.value = error?.message || '카테고리 카드 저장에 실패했습니다.'
    showToast('카테고리 카드 저장에 실패했습니다.')
  }
}

function resetCategoryCardSettings() {
  categoryCardDraftItems.value = (contentState.categoryItems || []).map((item) => ({ ...item }))
  isCategoryCardDirty.value = false
}

async function moveProductOrder(item, direction) {
  if (!db) return
  const list = [...filteredTabProducts.value]
  const index = list.findIndex((entry) => entry.id === item.id)
  const targetIndex = index + direction
  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return

  const cat = activeCategoryTab.value
  const every = [...activeTabProducts.value]
  if (!every.length) return

  /** 현재 탭 전체를 ALL 기준으로 정렬한 뒤, 화면에서 맞바꿀 두 칸만 교환하고 order를 0…n-1로 다시 부여 */
  const fullSorted = sortAdminProducts(cat, 'ALL', every)
  const idxA = fullSorted.findIndex((p) => p.id === list[index].id)
  const idxB = fullSorted.findIndex((p) => p.id === list[targetIndex].id)
  if (idxA < 0 || idxB < 0) return

  const arr = [...fullSorted]
  ;[arr[idxA], arr[idxB]] = [arr[idxB], arr[idxA]]

  errorMessage.value = ''
  try {
    await Promise.all(
      arr.map((p, i) =>
        updateDoc(doc(db, 'product', p.id), { order: i, updatedAt: serverTimestamp() }),
      ),
    )
  } catch (err) {
    errorMessage.value = err?.message || '순서 저장에 실패했습니다.'
  }
}

function editProduct(item) {
  selectedId.value = item.id
  form.category = normalizeCategory(item.category) || 'camera'
  form.section = normalizeSectionForCategory(form.category, item.section, item.name)
  form.subSections = Array.isArray(item.subSections)
    ? [...new Set(item.subSections.map((s) => String(s || '').trim()).filter(Boolean))].filter((s) => s !== form.section)
    : []
  form.name = item.name || ''
  form.brand = item.brand || ''
  form.originalPrice = Number(item.originalPrice || 0)
  form.discountPrice = isDiscountPriceLockedCategory(item.category)
    ? Number(item.originalPrice || 0)
    : Number(item.discountPrice || 0)
  form.priceDisplayText = String(item.priceDisplayText || '')
  form.titleExtraText = String(item.titleExtraText || '')
  form.detailFooterText = String(item.detailFooterText || '')
  form.detailFooterImages = Array.isArray(item.detailFooterImages) ? [...item.detailFooterImages] : []
  form.baseComponentsText = Array.isArray(item.baseComponents) ? item.baseComponents.join('\n') : ''
  form.optionsText = Array.isArray(item.options)
    ? serializeOptionsToText(mergeOptionsWithLocalFallback(item.category, item.id, item.options))
    : ''
  form.images = Array.isArray(item.images) ? [...item.images] : item.mainImage ? [item.mainImage] : []
  form.thumbImages = Array.isArray(item.thumbImages)
    ? [...item.thumbImages]
    : item.thumbImage
      ? [item.thumbImage]
      : [...form.images]
  const inferredOptionOnly =
    !!item.optionOnlyPricing ||
    (Number(item.originalPrice || 0) === 0 &&
      (!Array.isArray(item.baseComponents) || item.baseComponents.length === 0) &&
      Array.isArray(item.options) &&
      item.options.length > 0)
  form.optionOnlyPricing = inferredOptionOnly
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
  const options = parseOptionsFromText(form.optionsText)
  const subSections = [...new Set(form.subSections.map((s) => String(s || '').trim()).filter(Boolean))].filter(
    (s) => s !== form.section,
  )
  const imageUrls = [...form.images].map((u) => String(u || '').trim()).filter(Boolean)
  const thumbUrls = [...form.thumbImages].map((u) => String(u || '').trim()).filter(Boolean)
  return {
    category: normalizeCategory(form.category),
    section: form.section.trim(),
    subSections,
    name: form.name.trim(),
    slug: resolveProductSlug({ name: form.name }, selectedProduct.value?.id),
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
    optionOnlyPricing: !!form.optionOnlyPricing,
    baseComponents: parseBaseComponents(),
    options,
    images: imageUrls,
    mainImage: imageUrls[0] || '',
    thumbImages: thumbUrls,
    thumbImage: thumbUrls[0] || imageUrls[0] || '',
    accessories: [],
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
    const imageList = Array.isArray(target.images) ? [...target.images] : []
    const thumbList = Array.isArray(target.thumbImages) ? [...target.thumbImages] : []
    const main = String(target.mainImage || '').trim()
    const thumbMain = String(target.thumbImage || '').trim()
    if (main && !imageList.includes(main)) imageList.push(main)
    if (thumbMain && !thumbList.includes(thumbMain)) thumbList.push(thumbMain)
    const footerUrls = Array.isArray(target.detailFooterImages) ? target.detailFooterImages : []
    await deleteStorageUrls(storage, [...imageList, ...thumbList, ...footerUrls])
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

async function saveHeroBanner() {
  const url = heroBannerInput.value.trim()
  if (!url) return
  try {
    heroBannerImagesDraft.value = [url, ...heroBannerImagesDraft.value.filter((item) => item !== url)]
    await updateHeroBannerImages(heroBannerImagesDraft.value)
    bannerMessage.value = '메인 배너가 저장되었습니다.'
    showToast('메인 배너가 저장되었습니다.')
  } catch (error) {
    bannerMessage.value = error?.message || '메인 배너 저장에 실패했습니다.'
  }
}

async function resetHeroBanner() {
  const previous = [...heroBannerImagesDraft.value]
  try {
    await updateHeroBannerImages(['/assets/images/main1.png'])
    heroBannerInput.value = '/assets/images/main1.png'
    bannerMessage.value = '기본 배너로 복원했습니다.'
    await deleteStorageUrls(storage, previous)
  } catch (error) {
    bannerMessage.value = error?.message || '기본 배너 복원에 실패했습니다.'
  }
}

async function removeHeroBannerAt(index) {
  const removed = heroBannerImagesDraft.value[index]
  const next = heroBannerImagesDraft.value.filter((_, i) => i !== index)
  isHeroBannerDraftSyncPaused.value = true
  try {
    heroBannerImagesDraft.value = next.length ? next : ['/assets/images/main1.png']
    await updateHeroBannerImages(heroBannerImagesDraft.value)
    bannerMessage.value = '배너 구성이 저장되었습니다.'
    await deleteStorageObjectByUrl(storage, removed)
  } catch (error) {
    heroBannerImagesDraft.value = Array.isArray(contentState.heroBannerImages)
      ? [...contentState.heroBannerImages]
      : []
    bannerMessage.value = error?.message || '배너 삭제에 실패했습니다.'
  } finally {
    isHeroBannerDraftSyncPaused.value = false
  }
}

async function moveHeroBanner(index, direction) {
  const target = index + direction
  if (target < 0 || target >= heroBannerImagesDraft.value.length) return
  const next = [...heroBannerImagesDraft.value]
  const temp = next[index]
  next[index] = next[target]
  next[target] = temp
  try {
    heroBannerImagesDraft.value = next
    await updateHeroBannerImages(next)
  } catch (error) {
    bannerMessage.value = error?.message || '배너 순서 저장에 실패했습니다.'
  }
}

async function saveHeroBannerMobile() {
  const url = heroBannerMobileInput.value.trim()
  if (!url) return
  const cur = [...heroBannerImagesMobileDraft.value]
  if (cur.includes(url)) {
    bannerMobileMessage.value =
      '이미 목록에 있는 주소입니다. 맨 앞·맨 뒤로 옮기려면 위·아래 버튼으로 순서를 조정하세요.'
    showToast('이미 목록에 포함된 URL입니다.')
    return
  }
  isHeroBannerMobileDraftSyncPaused.value = true
  try {
    cur.push(url)
    heroBannerImagesMobileDraft.value = cur
    await updateHeroBannerImagesMobile(cur)
    bannerMobileMessage.value = '모바일 배너가 저장되었습니다.'
    showToast('모바일 배너가 저장되었습니다.')
  } catch (error) {
    heroBannerImagesMobileDraft.value = Array.isArray(contentState.heroBannerImagesMobile)
      ? [...contentState.heroBannerImagesMobile]
      : []
    bannerMobileMessage.value = error?.message || '모바일 배너 저장에 실패했습니다.'
  } finally {
    isHeroBannerMobileDraftSyncPaused.value = false
  }
}

async function saveHeroBannerText() {
  const title = String(heroBannerTitleInput.value || '').trim()
  const descriptionLines = String(heroBannerDescriptionInput.value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  try {
    await updateHeroBannerText(title, descriptionLines)
    bannerMessage.value = '메인 배너 문구가 저장되었습니다.'
    showToast('메인 배너 문구가 저장되었습니다.')
  } catch (error) {
    bannerMessage.value = error?.message || '메인 배너 문구 저장에 실패했습니다.'
  }
}

function updateGuideCardText(index, key, value) {
  const next = guideInfoCardTextsInput.value.map((entry, idx) =>
    idx === index ? { ...entry, [key]: value } : entry,
  )
  guideInfoCardTextsInput.value = next
}

async function saveGuideInfoText() {
  const next = guideInfoCardTextsInput.value.map((entry) => ({
    title: normalizeGuideTitleInput(entry?.title),
    body: String(entry?.body || '').trim(),
    footer: String(entry?.footer || '').trim(),
  }))
  try {
    await updateGuideInfoCardTexts(next)
    bannerMessage.value = '이용안내 카드 텍스트가 저장되었습니다.'
    showToast('이용안내 텍스트가 저장되었습니다.')
  } catch (error) {
    bannerMessage.value = error?.message || '이용안내 텍스트 저장에 실패했습니다.'
  }
}

function updateGuideStepField(index, key, value) {
  const next = guideStepsInput.value.map((entry, idx) =>
    idx === index ? { ...entry, [key]: value } : entry,
  )
  guideStepsInput.value = next
}

async function saveGuideStepsText() {
  const next = guideStepsInput.value.map((entry, index) => ({
    step: String(entry?.step || `${index + 1}`).trim(),
    title: String(entry?.title || '').trim(),
    subtitle: String(entry?.subtitle || '').trim(),
    body: String(entry?.body || '').trim(),
    extraTitle: String(entry?.extraTitle || '').trim(),
    extraBody: String(entry?.extraBody || '').trim(),
  }))
  try {
    await updateGuideSteps(next)
    bannerMessage.value = '이용안내 하단 단계 카드가 저장되었습니다.'
    showToast('이용안내 하단 단계 카드가 저장되었습니다.')
  } catch (error) {
    bannerMessage.value = error?.message || '이용안내 하단 단계 카드 저장에 실패했습니다.'
  }
}

function updateDiscountTextField(key, value) {
  discountTextContentInput.value = { ...discountTextContentInput.value, [key]: value }
}

async function saveDiscountTextContent() {
  const parsedColumns = String(discountRoundColumnsInput.value || '')
    .split(/\n\s*\n/)
    .map((chunk) =>
      chunk
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const normalized = line.replace(/\s*-\s*>?\s*/g, '|')
          const [round, rate] = normalized.split('|').map((part) => String(part || '').trim())
          if (!round || !rate) return null
          return [round, rate]
        })
        .filter(Boolean),
    )
    .filter((column) => column.length)
  try {
    await updateDiscountTextContent(discountTextContentInput.value)
    await updateDiscountRoundColumns(parsedColumns)
    bannerMessage.value = '할인정보 텍스트가 저장되었습니다.'
    showToast('할인정보 텍스트가 저장되었습니다.')
  } catch (error) {
    bannerMessage.value = error?.message || '할인정보 텍스트 저장에 실패했습니다.'
  }
}

async function clearHeroBannerMobile() {
  if (!window.confirm('모바일 전용 배너를 모두 제거할까요? (모바일에서도 PC 배너가 표시됩니다)')) return
  const previous = [...heroBannerImagesMobileDraft.value]
  isHeroBannerMobileDraftSyncPaused.value = true
  try {
    heroBannerImagesMobileDraft.value = []
    await updateHeroBannerImagesMobile([])
    heroBannerMobileInput.value = ''
    bannerMobileMessage.value = '모바일 전용 배너를 비웠습니다. 모바일에서는 PC 배너가 사용됩니다.'
    await deleteStorageUrls(storage, previous)
  } catch (error) {
    heroBannerImagesMobileDraft.value = Array.isArray(contentState.heroBannerImagesMobile)
      ? [...contentState.heroBannerImagesMobile]
      : []
    bannerMobileMessage.value = error?.message || '모바일 배너 비우기에 실패했습니다.'
  } finally {
    isHeroBannerMobileDraftSyncPaused.value = false
  }
}

async function removeHeroBannerMobileAt(index) {
  const removed = heroBannerImagesMobileDraft.value[index]
  const next = heroBannerImagesMobileDraft.value.filter((_, i) => i !== index)
  isHeroBannerMobileDraftSyncPaused.value = true
  try {
    heroBannerImagesMobileDraft.value = next
    await updateHeroBannerImagesMobile(next)
    bannerMobileMessage.value = '모바일 배너 구성이 저장되었습니다.'
    await deleteStorageObjectByUrl(storage, removed)
  } catch (error) {
    heroBannerImagesMobileDraft.value = Array.isArray(contentState.heroBannerImagesMobile)
      ? [...contentState.heroBannerImagesMobile]
      : []
    bannerMobileMessage.value = error?.message || '모바일 배너 삭제에 실패했습니다.'
  } finally {
    isHeroBannerMobileDraftSyncPaused.value = false
  }
}

async function moveHeroBannerMobile(index, direction) {
  const target = index + direction
  if (target < 0 || target >= heroBannerImagesMobileDraft.value.length) return
  const next = [...heroBannerImagesMobileDraft.value]
  const temp = next[index]
  next[index] = next[target]
  next[target] = temp
  isHeroBannerMobileDraftSyncPaused.value = true
  try {
    heroBannerImagesMobileDraft.value = next
    await updateHeroBannerImagesMobile(next)
  } catch (error) {
    heroBannerImagesMobileDraft.value = Array.isArray(contentState.heroBannerImagesMobile)
      ? [...contentState.heroBannerImagesMobile]
      : []
    bannerMobileMessage.value = error?.message || '모바일 배너 순서 저장에 실패했습니다.'
  } finally {
    isHeroBannerMobileDraftSyncPaused.value = false
  }
}

async function uploadHeroBannerMobile(event) {
  if (!storage) return
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  isBannerMobileUploading.value = true
  isHeroBannerMobileDraftSyncPaused.value = true
  bannerMobileMessage.value = ''
  try {
    const base = Date.now()
    const uploaded = []
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      const key = `products/banners/mobile/${base}-${i}-${file.name}`
      const fileRef = storageRef(storage, key)
      await uploadBytes(fileRef, file)
      uploaded.push(await getDownloadURL(fileRef))
    }
    heroBannerImagesMobileDraft.value = [...heroBannerImagesMobileDraft.value, ...uploaded]
    await updateHeroBannerImagesMobile(heroBannerImagesMobileDraft.value)
    if (uploaded[0]) heroBannerMobileInput.value = uploaded[0]
    bannerMobileMessage.value = '모바일 배너 이미지가 업로드되었습니다.'
  } catch (error) {
    heroBannerImagesMobileDraft.value = Array.isArray(contentState.heroBannerImagesMobile)
      ? [...contentState.heroBannerImagesMobile]
      : []
    bannerMobileMessage.value = error?.message || '모바일 배너 업로드에 실패했습니다.'
  } finally {
    isBannerMobileUploading.value = false
    isHeroBannerMobileDraftSyncPaused.value = false
    event.target.value = ''
  }
}

async function uploadHeroBanner(event) {
  if (!storage) return
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  isBannerUploading.value = true
  bannerMessage.value = ''
  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const key = `products/banners/${Date.now()}-${file.name}`
        const fileRef = storageRef(storage, key)
        await uploadBytes(fileRef, file)
        return getDownloadURL(fileRef)
      }),
    )
    heroBannerImagesDraft.value = [...heroBannerImagesDraft.value, ...uploaded]
    await updateHeroBannerImages(heroBannerImagesDraft.value)
    if (uploaded[0]) heroBannerInput.value = uploaded[0]
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
      <button
        type="button"
        class="admin-tab-button"
        :class="{ active: activeAdminTab === 'guideText' }"
        @click="activeAdminTab = 'guideText'"
      >
        이용안내 텍스트
      </button>
      <button
        type="button"
        class="admin-tab-button"
        :class="{ active: activeAdminTab === 'discountText' }"
        @click="activeAdminTab = 'discountText'"
      >
        할인정보 텍스트
      </button>
    </div>

    <section v-show="activeAdminTab === 'banner'" class="admin-section admin-banner-section">
      <h2>메인 배너 슬라이드 관리</h2>
      <p class="admin-help">여러 배너를 등록하면 홈에서 자동 슬라이드됩니다. 맨 위 항목이 첫 화면입니다.</p>
      <img :src="heroBannerImagesDraft[0] || contentState.heroBannerImageUrl" alt="메인 배너 미리보기" class="admin-hero-preview" />

      <label class="admin-label">배너 이미지 URL 추가</label>
      <input v-model="heroBannerInput" type="text" placeholder="https://..." />
      <div class="admin-upload-row">
        <input type="file" multiple accept="image/*" @change="uploadHeroBanner" />
        <span v-if="isBannerUploading">업로드 중...</span>
      </div>
      <div class="admin-form-actions">
        <button type="button" @click="saveHeroBanner">URL 추가/저장</button>
        <button type="button" @click="resetHeroBanner">기본 이미지로 복원</button>
      </div>

      <div class="admin-image-list" style="margin-top: 12px">
        <div v-for="(image, index) in heroBannerImagesDraft" :key="`${image}-${index}`" class="admin-image-item">
          <img :src="image" alt="hero banner" />
          <p class="admin-help" style="margin: 0; word-break: break-all">#{{ index + 1 }}</p>
          <div class="admin-item-actions">
            <button type="button" @click="moveHeroBanner(index, -1)">위로</button>
            <button type="button" @click="moveHeroBanner(index, 1)">아래로</button>
            <button type="button" class="danger" @click="removeHeroBannerAt(index)">삭제</button>
          </div>
        </div>
      </div>

      <p v-if="bannerMessage" class="admin-help">{{ bannerMessage }}</p>

      <hr style="margin: 24px 0; border: none; border-top: 1px dashed #e5e5e5" />

      <h2>메인 배너 문구 관리</h2>
      <p class="admin-help">홈 메인 배너에 표시되는 제목/설명 문구를 수정합니다.</p>
      <div class="admin-banner-text-grid">
        <div class="admin-banner-text-editor">
          <label class="admin-label">배너 제목</label>
          <input v-model="heroBannerTitleInput" type="text" placeholder="예: 감독이 운영하는 감독을 위한 렌탈" />
          <label class="admin-label">배너 설명 (줄바꿈으로 여러 줄)</label>
          <textarea
            v-model="heroBannerDescriptionInput"
            rows="6"
            placeholder="한 줄에 한 문장씩 입력하세요"
          ></textarea>
          <p class="admin-help">엔터(줄바꿈) 기준으로 홈에서 문장이 한 줄씩 표시됩니다.</p>
          <div class="admin-form-actions">
            <button type="button" class="admin-primary-button" @click="saveHeroBannerText">문구 저장</button>
          </div>
        </div>
        <div class="admin-banner-text-preview">
          <p class="admin-banner-preview-label">실시간 미리보기</p>
          <h3 v-if="heroBannerTitleInput.trim()">{{ heroBannerTitleInput.trim() }}</h3>
          <p v-if="heroBannerDescriptionInput.split('\n').map((item) => item.trim()).filter(Boolean).length">
            <span
              v-for="(line, idx) in heroBannerDescriptionInput
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean)"
              :key="`banner-text-preview-${idx}`"
              class="hero-desc-line"
            >
              {{ line }}
            </span>
          </p>
          <p
            v-if="!heroBannerTitleInput.trim() && !heroBannerDescriptionInput.split('\n').map((item) => item.trim()).filter(Boolean).length"
            class="admin-help"
          >
            홈에서는 제목·설명이 비어 있으면 표시되지 않습니다.
          </p>
        </div>
      </div>

      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e5e5" />

      <h2>모바일 전용 배너 슬라이드 관리</h2>
      <p class="admin-help">
        모바일(폭 768px 이하)에서 사용할 배너입니다. 등록하지 않으면 PC 배너가 그대로 사용됩니다.<br />
        <strong>2장 이상</strong> 등록해야 모바일 자동 슬라이드가 동작합니다. 1장만 등록하면 첫 화면은 그 이미지가 보이고, 이어지는 슬라이드는 PC 배너가 사용됩니다.<br />
        여러 장을 한 번에 선택하면 <strong>파일 선택 순서대로</strong> 목록 끝에 붙습니다. 맨 위(#1)가 첫 슬라이드입니다. URL로 추가할 때도 목록 <strong>맨 뒤</strong>에 붙으며, 순서는 위·아래 버튼으로 바꿀 수 있습니다.<br />
        모바일은 화면이 좁아 좌우가 잘려보일 수 있으니, 세로 비율이 큰 이미지(권장 1:1 또는 4:5) 사용을 추천합니다.
      </p>
      <img
        v-if="heroBannerImagesMobileDraft[0]"
        :src="heroBannerImagesMobileDraft[0]"
        alt="모바일 배너 미리보기"
        class="admin-hero-preview"
      />

      <label class="admin-label">모바일 배너 이미지 URL 추가</label>
      <input v-model="heroBannerMobileInput" type="text" placeholder="https://..." />
      <div class="admin-upload-row">
        <input type="file" multiple accept="image/*" @change="uploadHeroBannerMobile" />
        <span v-if="isBannerMobileUploading">업로드 중...</span>
      </div>
      <div class="admin-form-actions">
        <button type="button" @click="saveHeroBannerMobile">URL 추가/저장</button>
        <button type="button" @click="clearHeroBannerMobile">모바일 배너 비우기</button>
      </div>

      <div class="admin-image-list" style="margin-top: 12px">
        <div
          v-for="(image, index) in heroBannerImagesMobileDraft"
          :key="`mobile-${image}-${index}`"
          class="admin-image-item"
        >
          <img :src="image" alt="mobile hero banner" />
          <p class="admin-help" style="margin: 0; word-break: break-all">#{{ index + 1 }}</p>
          <div class="admin-item-actions">
            <button type="button" @click="moveHeroBannerMobile(index, -1)">위로</button>
            <button type="button" @click="moveHeroBannerMobile(index, 1)">아래로</button>
            <button type="button" class="danger" @click="removeHeroBannerMobileAt(index)">삭제</button>
          </div>
        </div>
      </div>

      <p v-if="bannerMobileMessage" class="admin-help">{{ bannerMobileMessage }}</p>
    </section>

    <section v-show="activeAdminTab === 'guideText'" class="admin-section">
      <h2>이용안내 카드 텍스트 관리</h2>
      <p class="admin-help">이용안내 페이지 상단 4개 카드의 제목/본문/하단 문구를 수정합니다.</p>
      <div class="admin-guide-card-grid">
        <article
          v-for="(card, index) in guideInfoCardTextsInput"
          :key="`guide-card-admin-main-${index}`"
          class="admin-guide-card-editor"
        >
          <h3>카드 {{ index + 1 }}</h3>
          <label class="admin-label">제목 (한 줄 · 저장 시 줄바꿈은 자동으로 공백 처리)</label>
          <textarea
            :value="card.title"
            class="admin-guide-card-title-field"
            rows="2"
            placeholder="예: 예약 및 대여 시간"
            @input="updateGuideCardText(index, 'title', $event.target.value)"
          ></textarea>
          <label class="admin-label">본문 (줄바꿈으로 한 줄씩)</label>
          <textarea
            :value="card.body"
            rows="5"
            placeholder="한 줄에 한 문장씩 입력"
            @input="updateGuideCardText(index, 'body', $event.target.value)"
          ></textarea>
          <label v-if="index === 3" class="admin-label">하단 문구 (예약문의 카드 전용)</label>
          <input
            v-if="index === 3"
            :value="card.footer"
            type="text"
            placeholder="예: 7:00 am - 11:00 pm 상담 가능"
            @input="updateGuideCardText(index, 'footer', $event.target.value)"
          />
        </article>
      </div>
      <div class="admin-form-actions">
        <button type="button" class="admin-primary-button" @click="saveGuideInfoText">이용안내 텍스트 저장</button>
      </div>
      <hr style="margin: 24px 0; border: none; border-top: 1px dashed #e5e5e5" />
      <h2>이용안내 하단 단계(01/02/03) 관리</h2>
      <p class="admin-help">Guide 페이지 하단 단계 카드의 번호/제목/본문을 수정합니다.</p>
      <div class="admin-guide-card-grid">
        <article
          v-for="(stepCard, index) in guideStepsInput.slice(0, 3)"
          :key="`guide-step-admin-${index}`"
          class="admin-guide-card-editor"
        >
          <h3>단계 카드 {{ index + 1 }}</h3>
          <label class="admin-label">번호</label>
          <input
            :value="stepCard.step"
            type="text"
            placeholder="예: 01"
            @input="updateGuideStepField(index, 'step', $event.target.value)"
          />
          <label class="admin-label">제목</label>
          <input
            :value="stepCard.title"
            type="text"
            placeholder="예: How to use"
            @input="updateGuideStepField(index, 'title', $event.target.value)"
          />
          <label class="admin-label">소제목 1</label>
          <input
            :value="stepCard.subtitle"
            type="text"
            placeholder="예: Kakao"
            @input="updateGuideStepField(index, 'subtitle', $event.target.value)"
          />
          <label class="admin-label">본문 1 (줄바꿈 가능)</label>
          <textarea
            :value="stepCard.body"
            rows="4"
            @input="updateGuideStepField(index, 'body', $event.target.value)"
          ></textarea>
          <label class="admin-label">소제목 2 (선택)</label>
          <input
            :value="stepCard.extraTitle"
            type="text"
            placeholder="예: Payment information"
            @input="updateGuideStepField(index, 'extraTitle', $event.target.value)"
          />
          <label class="admin-label">본문 2 (선택)</label>
          <textarea
            :value="stepCard.extraBody"
            rows="4"
            @input="updateGuideStepField(index, 'extraBody', $event.target.value)"
          ></textarea>
        </article>
      </div>
      <div class="admin-form-actions">
        <button type="button" class="admin-primary-button" @click="saveGuideStepsText">
          하단 단계 카드 저장
        </button>
      </div>
    </section>

    <section v-show="activeAdminTab === 'discountText'" class="admin-section">
      <h2>할인정보/유의사항 텍스트 관리</h2>
      <p class="admin-help">
        할인 종류 명칭이 바뀌어도 수정할 수 있도록 각 섹션 제목/본문을 편집할 수 있습니다. 본문은 줄바꿈 기준으로
        목록 항목이 됩니다.
      </p>
      <div class="admin-discount-text-grid">
        <label class="admin-label">메인 제목</label>
        <input
          :value="discountTextContentInput.mainTitle"
          type="text"
          @input="updateDiscountTextField('mainTitle', $event.target.value)"
        />
        <label class="admin-label">메인 설명</label>
        <input
          :value="discountTextContentInput.mainSubtitle"
          type="text"
          @input="updateDiscountTextField('mainSubtitle', $event.target.value)"
        />
        <label class="admin-label">독립할인 제목</label>
        <input
          :value="discountTextContentInput.independentTitle"
          type="text"
          @input="updateDiscountTextField('independentTitle', $event.target.value)"
        />
        <label class="admin-label">독립할인 박스1 제목 / 본문</label>
        <input
          :value="discountTextContentInput.independentBox1Title"
          type="text"
          @input="updateDiscountTextField('independentBox1Title', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.independentBox1Body"
          rows="4"
          @input="updateDiscountTextField('independentBox1Body', $event.target.value)"
        ></textarea>
        <label class="admin-label">독립할인 박스2 제목 / 본문</label>
        <input
          :value="discountTextContentInput.independentBox2Title"
          type="text"
          @input="updateDiscountTextField('independentBox2Title', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.independentBox2Body"
          rows="4"
          @input="updateDiscountTextField('independentBox2Body', $event.target.value)"
        ></textarea>
        <label class="admin-label">회차할인 제목 / 설명</label>
        <input
          :value="discountTextContentInput.roundTitle"
          type="text"
          @input="updateDiscountTextField('roundTitle', $event.target.value)"
        />
        <input
          :value="discountTextContentInput.roundSubtitle"
          type="text"
          @input="updateDiscountTextField('roundSubtitle', $event.target.value)"
        />
        <label class="admin-label">회차할인 표 데이터 (열과 열 사이는 빈 줄)</label>
        <textarea
          :value="discountRoundColumnsInput"
          rows="12"
          placeholder="01회차 | 00%
02회차 | 05%

06회차 | 22%
07회차 | 24%"
          @input="discountRoundColumnsInput = $event.target.value"
        ></textarea>
        <label class="admin-label">선결제할인 제목 / 본문</label>
        <input
          :value="discountTextContentInput.prepayTitle"
          type="text"
          @input="updateDiscountTextField('prepayTitle', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.prepayBody"
          rows="4"
          @input="updateDiscountTextField('prepayBody', $event.target.value)"
        ></textarea>
        <label class="admin-label">단골할인 제목 / 배지 / 본문</label>
        <input
          :value="discountTextContentInput.regularTitle"
          type="text"
          @input="updateDiscountTextField('regularTitle', $event.target.value)"
        />
        <input
          :value="discountTextContentInput.regularBadge"
          type="text"
          @input="updateDiscountTextField('regularBadge', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.regularBody"
          rows="4"
          @input="updateDiscountTextField('regularBody', $event.target.value)"
        ></textarea>
        <label class="admin-label">유의사항 제목</label>
        <input
          :value="discountTextContentInput.notesTitle"
          type="text"
          @input="updateDiscountTextField('notesTitle', $event.target.value)"
        />
        <label class="admin-label">Problem 제목 / 본문</label>
        <input
          :value="discountTextContentInput.problemTitle"
          type="text"
          @input="updateDiscountTextField('problemTitle', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.problemBody"
          rows="6"
          @input="updateDiscountTextField('problemBody', $event.target.value)"
        ></textarea>
        <label class="admin-label">Document 제목 / 본문</label>
        <input
          :value="discountTextContentInput.documentTitle"
          type="text"
          @input="updateDiscountTextField('documentTitle', $event.target.value)"
        />
        <textarea
          :value="discountTextContentInput.documentBody"
          rows="4"
          @input="updateDiscountTextField('documentBody', $event.target.value)"
        ></textarea>
      </div>
      <div class="admin-form-actions">
        <button type="button" class="admin-primary-button" @click="saveDiscountTextContent">할인정보 텍스트 저장</button>
      </div>
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
            <button
              v-for="(section, sectionIndex) in activeTaxonomyDraft?.sections || []"
              :key="`${section}-${sectionIndex}`"
              type="button"
              class="taxonomy-chip"
              :class="{ active: taxonomyActiveSection === section }"
              :disabled="!activeTaxonomyDraft"
              @click="taxonomyActiveSection = section"
            >
              {{ section }}
            </button>
          </div>
          <div
            v-if="activeTaxonomyDraft && (activeTaxonomyDraft.sections || []).length"
            class="admin-item-actions"
          >
            <button
              type="button"
              :disabled="taxonomyActiveSectionIndex < 1"
              @click="moveTaxonomySection(taxonomyActiveSectionIndex, -1)"
            >
              위로
            </button>
            <button
              type="button"
              :disabled="
                taxonomyActiveSectionIndex < 0 ||
                taxonomyActiveSectionIndex >= (activeTaxonomyDraft?.sections?.length || 0) - 1
              "
              @click="moveTaxonomySection(taxonomyActiveSectionIndex, 1)"
            >
              아래로
            </button>
            <button
              type="button"
              class="danger"
              :disabled="!taxonomyActiveSection"
              @click="removeTaxonomySection(taxonomyActiveSection)"
            >
              삭제
            </button>
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
          구성 설명은 <strong>기본 구성품</strong>에 넣어도 됩니다(표시용, 본체 가격과는 별개).
        </p>
        <label class="admin-label">가격 표시 문구(선택)</label>
        <input v-model="form.priceDisplayText" type="text" placeholder="예: 조명기 대여시 무료" />
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
          placeholder="한 줄: 그룹명: 옵션1, 옵션2&#10;상세 기본 선택: *옵션명 (싱글·멀티 모두, 여러 개 가능)&#10;예: Cage (Single): *본체 케이지 +0, 풀 세트 +50000"
        ></textarea>
        <p class="admin-help">
          <code>그룹명: 옵션1, 옵션2</code> 줄마다 작성합니다. 상세에서 처음부터 선택해 둘 항목만
          <strong><code>*옵션명</code></strong>(별 접두)로 적습니다. 싱글·멀티 모두
          <strong>*가 없으면 해당 그룹은 상세에서 비워 둡니다</strong>. 멀티는
          <code>*</code>를 여러 개 붙여 기본 조합을 지정합니다. 코드에만 있는 기본값은 수정 화면에 자동으로
          *가 채워질 수 있습니다(저장 시 Firestore에도 반영됩니다).
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
          <div
            v-for="(image, index) in form.detailFooterImages"
            :key="`detail-${image}-${index}`"
            class="admin-image-item"
          >
            <img :src="image" alt="detail-footer-uploaded" />
            <button type="button" class="danger" @click="removeDetailFooterImage(index)">삭제</button>
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
      <p class="admin-help">
        Firestore <code>order</code>가 있는 상품은 그 숫자 순서가 먼저 적용됩니다. 값이 없으면 이름 기준 고정
        순서(코드에 정의된 목록)와 같습니다. 위/아래는 이 탭(카테고리) 전체 순서에서 인접한 두 상품을 맞바꾼 뒤,
        해당 탭 상품의 <code>order</code>를 0부터 다시 맞춥니다. 맨 위·맨 아래 줄에서는 위로/아래로 중 한쪽만
        동작합니다.
      </p>
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
          <p>{{ item.brand }} · {{ adminListPriceDisplay(item) }}</p>
          <p v-if="String(item.priceDisplayText || '').trim()" class="admin-help admin-item-price-hint">
            {{ adminListPriceNumericHint(item) }}
          </p>
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
