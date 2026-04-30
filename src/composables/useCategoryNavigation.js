import { computed } from 'vue'
import { useContentStore } from '../stores/contentStore'

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
  const key = String(categoryKey || '').trim().toLowerCase()
  return ROUTE_BY_CATEGORY[key] || `/${key}`
}

export function useCategoryNavigation() {
  const { state } = useContentStore()

  const categoryTabs = computed(() => {
    const keys =
      Array.isArray(state.taxonomyCategories) && state.taxonomyCategories.length
        ? state.taxonomyCategories
        : Object.keys(ROUTE_BY_CATEGORY)
    return keys.map((key) => ({
      label: String(key || '').toUpperCase(),
      to: categoryPathFor(key),
    }))
  })

  return {
    categoryTabs,
    categoryPathFor,
  }
}
