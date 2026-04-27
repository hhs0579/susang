import { computed, onUnmounted, ref } from 'vue'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

function isFirebaseStorageUrl(value) {
  return /^https?:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//.test(String(value || ''))
}

function normalizeProduct(raw, fallbackId, fallbackProduct = null) {
  const images = Array.isArray(raw.images) ? raw.images : []
  const fallbackImages = fallbackProduct
    ? [fallbackProduct.image, ...(fallbackProduct.accessories || [])].filter(Boolean)
    : []

  const mergedImages = images.length
    ? images.map((url, index) => {
        // Firestore 이미지가 Firebase Storage URL이고 동일 인덱스의 로컬 에셋이 있으면 로컬 우선.
        if (isFirebaseStorageUrl(url) && fallbackImages[index]) return fallbackImages[index]
        return url
      })
    : fallbackImages

  const fallbackMainImage = fallbackProduct?.image || fallbackImages[0] || ''
  const mainImageRaw = raw.mainImage || raw.image || mergedImages[0] || ''
  const mainImage =
    isFirebaseStorageUrl(mainImageRaw) && fallbackMainImage ? fallbackMainImage : mainImageRaw || fallbackMainImage

  const rawAccessories = raw.accessories || (mergedImages.length > 1 ? mergedImages.slice(1) : [])
  const accessories = Array.isArray(rawAccessories)
    ? rawAccessories.map((url, index) => {
        if (isFirebaseStorageUrl(url) && fallbackImages[index + 1]) return fallbackImages[index + 1]
        return url
      })
    : []

  return {
    id: raw.id || fallbackId,
    section: raw.section || '',
    name: raw.name || '',
    brand: raw.brand || '',
    originalPrice: Number(raw.originalPrice || 0),
    discountPrice: Number(raw.discountPrice || 0),
    image: mainImage,
    accessories: Array.isArray(accessories) ? accessories : [],
    baseComponents: Array.isArray(raw.baseComponents) ? raw.baseComponents : [],
    options: Array.isArray(raw.options) ? raw.options : [],
  }
}

export function formatCurrency(value) {
  return `₩${Number(value || 0).toLocaleString('ko-KR')}`
}

export function useCategoryProducts(categoryKey, fallbackProducts = []) {
  const remoteProducts = ref([])
  const loading = ref(true)
  const error = ref('')

  const fallbackNormalized = computed(() => fallbackProducts.map((item) => normalizeProduct(item, item.id)))
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
          normalizeProduct({ id: doc.id, ...doc.data() }, doc.id, fallbackById.value.get(doc.id)),
        )
        remoteProducts.value = docs.sort((a, b) => a.name.localeCompare(b.name))
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
