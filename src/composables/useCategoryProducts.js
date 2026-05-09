import { computed, onUnmounted, ref } from 'vue'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { isFirebaseStorageUrl, prewarmRemoteImage } from '../utils/runtimeImageCache'

const warmedImageUrls = new Set()

function warmupProductThumbnails(items, limit = 24) {
  if (typeof Image === 'undefined' || !Array.isArray(items) || !items.length) return
  const targets = items
    .slice(0, Math.max(0, Number(limit) || 0))
    .map((item) => String(item?.thumbnail || item?.image || '').trim())
    .filter((url) => url && isFirebaseStorageUrl(url))
  for (const url of targets) {
    if (warmedImageUrls.has(url)) continue
    warmedImageUrls.add(url)
    prewarmRemoteImage(url)
  }
}

/** Firestore 옵션 항목 수 안에서만 유효한 인덱스 */
function clampDefaultIndices(indices, itemCount) {
  if (!Array.isArray(indices) || !indices.length || !Number.isFinite(itemCount) || itemCount <= 0) return []
  return [
    ...new Set(
      indices
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 0 && n < itemCount),
    ),
  ]
}

/**
 * 과거 관리자 저장 버그로 `+5,000`이 `+5` / `000`으로 쪼개진 데이터를 복구.
 */
function normalizeOptionItems(items) {
  if (!Array.isArray(items)) return []
  const normalized = []
  const splitLegacyItems = (text) =>
    String(text || '')
      .split(/,\s*(?=[^,\n]*\+\s*\d)/)
      .map((part) => part.trim())
      .filter(Boolean)

  for (const raw of items) {
    const cur = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim()
    if (!cur) continue

    // 레거시 데이터: 서로 다른 옵션이 한 문자열로 합쳐져 저장된 경우 분해
    const chunks = splitLegacyItems(cur)
    for (const chunk of chunks) {
      const prev = normalized[normalized.length - 1]
      // 과거 저장 버그로 +20 / 000처럼 끊긴 값은 다시 합치기
      if (prev && /^\d{3}$/.test(chunk) && /\+\s*\d+$/.test(prev)) {
        normalized[normalized.length - 1] = `${prev},${chunk}`
        continue
      }
      normalized.push(chunk)
    }
  }
  return normalized
}

function normalizeProduct(raw, fallbackId, fallbackProduct = null, optionsMode = 'full') {
  const fallbackImages = fallbackProduct
    ? [fallbackProduct.image, ...(fallbackProduct.accessories || [])].filter(Boolean)
    : []

  /** Firestore에 `images` 필드가 있으면(빈 배열 포함) 관리자 저장 내용을 그대로 쓰고, 없을 때만 로컬 데이터 폴백 */
  const hasStoredImagesArray = Array.isArray(raw.images)

  const mergedImages = hasStoredImagesArray
    ? raw.images.map((url) => String(url || '').trim()).filter(Boolean)
    : [...fallbackImages]

  const fallbackMainImage = fallbackProduct?.image || fallbackImages[0] || ''
  const mainImageRaw = hasStoredImagesArray
    ? String(mergedImages[0] || raw.mainImage || raw.image || '').trim()
    : String(raw.mainImage || raw.image || mergedImages[0] || '').trim()
  const mainImage = hasStoredImagesArray
    ? mainImageRaw
    : isFirebaseStorageUrl(mainImageRaw) && fallbackMainImage
      ? fallbackMainImage
      : mainImageRaw || fallbackMainImage
  const rawThumbImages = Array.isArray(raw.thumbImages)
    ? raw.thumbImages.map((url) => String(url || '').trim()).filter(Boolean)
    : []
  const thumbnail = String(rawThumbImages[0] || raw.thumbImage || '').trim() || mainImage

  /** `images`가 있으면 갤러리는 오직 그 배열만 사용(레거시 `accessories` 필드는 무시해 삭제한 장이 다시 나오지 않게 함) */
  const rawAccessories = hasStoredImagesArray
    ? mergedImages.length > 1
      ? mergedImages.slice(1)
      : []
    : raw.accessories || (mergedImages.length > 1 ? mergedImages.slice(1) : [])
  const accessories = Array.isArray(rawAccessories)
    ? rawAccessories
        .map((url, index) => {
          const u = String(url || '').trim()
          if (!u) return null
          if (hasStoredImagesArray) return u
          if (isFirebaseStorageUrl(u) && fallbackImages[index + 1]) return fallbackImages[index + 1]
          return u
        })
        .filter(Boolean)
    : []
  const rawSubSections = Array.isArray(raw.subSections)
    ? raw.subSections
    : Array.isArray(fallbackProduct?.subSections)
      ? fallbackProduct.subSections
      : []
  const subSections = [
    ...new Set(
      rawSubSections
        .map((s) => String(s || '').trim())
        .filter(Boolean),
    ),
  ]

  return {
    id: raw.id || fallbackId,
    section: String(raw.section || fallbackProduct?.section || '').trim(),
    name: raw.name || '',
    brand: raw.brand || '',
    priceDisplayText: String(raw.priceDisplayText || fallbackProduct?.priceDisplayText || '').trim(),
    titleExtraText: String(raw.titleExtraText || fallbackProduct?.titleExtraText || '').trim(),
    detailFooterText: String(raw.detailFooterText || fallbackProduct?.detailFooterText || '').trim(),
    detailFooterImages: Array.isArray(raw.detailFooterImages)
      ? raw.detailFooterImages
      : Array.isArray(fallbackProduct?.detailFooterImages)
        ? fallbackProduct.detailFooterImages
        : [],
    optionOnlyPricing: !!(raw.optionOnlyPricing ?? fallbackProduct?.optionOnlyPricing),
    order: Number.isFinite(Number(raw.order)) ? Number(raw.order) : undefined,
    originalPrice: Number(raw.originalPrice || 0),
    discountPrice: Number(raw.discountPrice || 0),
    image: mainImage,
    thumbnail,
    accessories: Array.isArray(accessories) ? accessories : [],
    subSections,
    baseComponents: Array.isArray(raw.baseComponents) ? raw.baseComponents : [],
    options: (() => {
      const rawOpts = Array.isArray(raw.options)
        ? raw.options
        : Array.isArray(fallbackProduct?.options)
          ? fallbackProduct.options
          : []

      if (optionsMode === 'none') return []
      if (optionsMode === 'lite') {
        return rawOpts
          .filter((g) => g && typeof g === 'object')
          .map((g) => ({
            group: String(g.group || '').trim(),
            items: Array.isArray(g.items)
              ? g.items.map((it) => (typeof it === 'string' ? it : String(it ?? '')).trim()).filter(Boolean)
              : [],
          }))
          .filter((g) => g.group)
      }

      const fbOpts = Array.isArray(fallbackProduct?.options) ? fallbackProduct.options : []

      return rawOpts
        .filter((g) => g && typeof g === 'object')
        .map((g, groupIndex) => {
          const items = normalizeOptionItems(g.items)
          const entry = {
            group: String(g.group || '').trim(),
            items,
          }
          const hasDefaultKey = Object.prototype.hasOwnProperty.call(g, 'defaultIndices')
          let idxs = clampDefaultIndices(g.defaultIndices, items.length)

          // defaultIndices 필드가 없을 때만 로컬 폴백 기본값 병합(빈 배열로 저장한 경우는 존중)
          if (!idxs.length && !hasDefaultKey && fbOpts[groupIndex]) {
            idxs = clampDefaultIndices(fbOpts[groupIndex].defaultIndices, items.length)
          }

          if (hasDefaultKey) {
            const c = clampDefaultIndices(g.defaultIndices, items.length)
            if (c.length) entry.defaultIndices = c
          } else if (idxs.length) {
            entry.defaultIndices = idxs
          }
          return entry
        })
        .filter((g) => g.group)
    })(),
  }
}

export function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString('ko-KR')}`
}

/** 옵션가로만 판매되는 상품인지 판별 */
export function isOptionOnlyProduct(item) {
  if (!item || typeof item !== 'object') return false
  if (item.optionOnlyPricing) return true
  const orig = Number(item.originalPrice || 0)
  const baseEmpty = !Array.isArray(item.baseComponents) || item.baseComponents.length === 0
  const hasOptions = Array.isArray(item.options) && item.options.length > 0
  return orig === 0 && baseEmpty && hasOptions
}

/** 옵션들 중 0원 초과 항목 중 가장 낮은 추가 금액 (없으면 0) */
export function getMinOptionExtraPrice(item) {
  if (!item || !Array.isArray(item.options)) return 0
  let min = Infinity
  for (const group of item.options) {
    const entries = Array.isArray(group?.items) ? group.items : []
    for (const entry of entries) {
      const match = String(entry || '').match(/\+\s*([\d,]+)\s*$/)
      if (!match) continue
      const num = Number(match[1].replaceAll(',', ''))
      if (Number.isFinite(num) && num > 0 && num < min) min = num
    }
  }
  return Number.isFinite(min) ? min : 0
}

/** 카드/상세 헤드라인에 보여줄 대표 가격: 옵션-only면 옵션 최저가, 아니면 할인가 */
export function getDisplayHeadlinePrice(item) {
  if (isOptionOnlyProduct(item)) {
    const min = getMinOptionExtraPrice(item)
    return min > 0 ? min : 0
  }
  return Number(item?.discountPrice || 0)
}

/** 서포트 카테고리는 항상 할인가 = 정상가 (렌탈 옵션 카테고리라 할인 표기 없음) */
export function isDiscountPriceLockedCategory(categoryKey) {
  return String(categoryKey || '').toLowerCase() === 'support'
}

function normalizePriceForCategory(product, categoryKey) {
  if (!product || typeof product !== 'object') return product
  if (!isDiscountPriceLockedCategory(categoryKey)) return product
  const original = Number(product.originalPrice || 0)
  if (original <= 0) return product
  return { ...product, discountPrice: original }
}

export function useCategoryProducts(categoryKey, fallbackProducts = [], config = {}) {
  const optionsMode = config?.optionsMode || 'full'
  const thumbWarmupLimit = Number.isFinite(Number(config?.thumbnailWarmupLimit))
    ? Math.max(0, Number(config.thumbnailWarmupLimit))
    : optionsMode === 'lite'
      ? 240
      : 24
  const remoteProducts = ref([])
  const loading = ref(true)
  const error = ref('')

  const fallbackNormalized = computed(() =>
    fallbackProducts.map((item) =>
      normalizePriceForCategory(normalizeProduct(item, item.id, null, optionsMode), categoryKey),
    ),
  )
  const fallbackById = computed(
    () => new Map(fallbackNormalized.value.map((item) => [item.id, item])),
  )

  let unsubscribe = null
  if (db) {
    const q = query(collection(db, 'product'), where('category', '==', categoryKey))
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) =>
          normalizePriceForCategory(
            normalizeProduct({ id: doc.id, ...doc.data() }, doc.id, fallbackById.value.get(doc.id), optionsMode),
            categoryKey,
          ),
        )
        remoteProducts.value = docs.sort((a, b) => {
          const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
          const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
          if (aOrder !== bOrder) return aOrder - bOrder
          return a.name.localeCompare(b.name)
        })
        warmupProductThumbnails(remoteProducts.value, thumbWarmupLimit)
        loading.value = false
      },
      (err) => {
        error.value = err?.message || '상품 데이터를 불러오지 못했습니다.'
        loading.value = false
      },
    )
  } else {
    loading.value = false
  }

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
  })

  const products = computed(() => (remoteProducts.value.length ? remoteProducts.value : fallbackNormalized.value))

  function getProductById(id) {
    return products.value.find((item) => item.id === id)
  }

  return {
    products,
    getProductById,
    loading,
    error,
  }
}
