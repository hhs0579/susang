import { computed, onUnmounted, ref } from 'vue'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'

function normalizeProduct(raw, fallbackId) {
  const images = Array.isArray(raw.images) ? raw.images : []
  const mainImage = raw.mainImage || raw.image || images[0] || ''
  const accessories = raw.accessories || (images.length > 1 ? images.slice(1) : [])

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

  let unsubscribe = null
  if (db) {
    const q = query(collection(db, 'product'), where('category', '==', categoryKey))
    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => normalizeProduct({ id: doc.id, ...doc.data() }, doc.id))
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
