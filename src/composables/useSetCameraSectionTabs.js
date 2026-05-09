import { computed } from 'vue'
import { useContentStore } from '../stores/contentStore'

/** 목록 필터·탭용 세부 카테고리 (레거시 section SET/CAMERA·빈 값은 brand로 대체) */
export function resolveSetListSection(item) {
  const s = String(item?.section || '').trim()
  if (!s || s.toUpperCase() === 'SET') return String(item?.brand || '').trim()
  return s
}

function normalizeSubSections(item) {
  return [
    ...new Set(
      (Array.isArray(item?.subSections) ? item.subSections : [])
        .map((s) => String(s || '').trim())
        .filter(Boolean),
    ),
  ]
}

export function resolveSetListSections(item) {
  return [resolveSetListSection(item), ...normalizeSubSections(item)]
}

export function resolveCameraListSection(item) {
  const s = String(item?.section || '').trim()
  if (!s || s.toUpperCase() === 'CAMERA') return String(item?.brand || '').trim()
  return s
}

export function resolveCameraListSections(item) {
  return [resolveCameraListSection(item), ...normalizeSubSections(item)]
}

function mergeSectionTabs(fromStore, items, resolveSections) {
  const merged = [...(fromStore || [])]
  const seen = new Set(merged)
  const extras = []
  for (const item of items) {
    for (const sec of resolveSections(item)) {
      if (sec && !seen.has(sec)) {
        seen.add(sec)
        extras.push(sec)
      }
    }
  }
  extras.sort((a, b) => a.localeCompare(b, 'en'))
  for (const s of extras) {
    if (!merged.includes(s)) merged.push(s)
  }
  return ['ALL', ...merged]
}

/** taxonomy + 실제 상품 section 병합 (관리자에만 있는 탭도 표시) */
export function useSetSubCategoryTabs(productsRef) {
  const { state } = useContentStore()
  return computed(() =>
    mergeSectionTabs(state.taxonomySectionsByCategory?.set, productsRef.value, resolveSetListSections),
  )
}

export function useCameraSubCategoryTabs(productsRef) {
  const { state } = useContentStore()
  return computed(() =>
    mergeSectionTabs(state.taxonomySectionsByCategory?.camera, productsRef.value, resolveCameraListSections),
  )
}
