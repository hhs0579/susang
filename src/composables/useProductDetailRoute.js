import { unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applyProductDetailSeo } from '../utils/applySeo'
import { productDetailPath, resolveProductSlug } from '../utils/productSlug'

/** 상세 URL을 slug 기준으로 맞추고, 상품별 SEO 메타를 적용 */
export function useProductDetailRoute(categoryKey, productRef) {
  const route = useRoute()
  const router = useRouter()

  watch(
    () => [productRef.value, route.params.id, unref(categoryKey)],
    ([product, param]) => {
      if (!product) return

      const category = unref(categoryKey)
      const canonicalPath = productDetailPath(category, product)
      const canonicalSlug = resolveProductSlug(product, product.id)
      const currentParam = String(param || '').trim()

      applyProductDetailSeo(category, product, canonicalPath)

      if (canonicalSlug && currentParam !== canonicalSlug) {
        router.replace(canonicalPath)
      }
    },
    { immediate: true },
  )
}
