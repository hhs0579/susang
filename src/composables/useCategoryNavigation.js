import { computed } from 'vue'
import { useContentStore } from '../stores/contentStore'
import { sanitizeCategoryKey } from '../utils/sanitizeCategoryKey'

const ROUTE_BY_CATEGORY = {
  set: '/set',
  camera: '/camera',
  lens: '/lens',
  support: '/support',
  grip: '/grip',
  monitor: '/monitor',
  light: '/light',
  intercom: '/intercom',
}

export function categoryPathFor(categoryKey) {
  const key = sanitizeCategoryKey(categoryKey)
  return ROUTE_BY_CATEGORY[key] || (key ? `/${key}` : '/')
}

export function useCategoryNavigation() {
  const { state } = useContentStore()

  const categoryTabs = computed(() => {
    const keys =
      Array.isArray(state.taxonomyCategories) && state.taxonomyCategories.length
        ? state.taxonomyCategories.map((key) => sanitizeCategoryKey(key)).filter(Boolean)
        : Object.keys(ROUTE_BY_CATEGORY)
    const seen = new Set()
    return keys
      .filter((key) => {
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map((key) => ({
        label: key.toUpperCase(),
        to: categoryPathFor(key),
      }))
  })

  return {
    categoryTabs,
    categoryPathFor,
  }
}
