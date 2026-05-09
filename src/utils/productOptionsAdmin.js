/**
 * 관리자 옵션 텍스트 ↔ Firestore options[] (group, items, defaultIndices?)
 */

import { cameraProducts } from '../data/cameraData.js'
import { gripProducts } from '../data/gripData.js'
import { intercomProducts } from '../data/intercomData.js'
import { lensProducts } from '../data/lensData.js'
import { lightProducts } from '../data/lightData.js'
import { monitorProducts } from '../data/monitorData.js'
import { setProducts } from '../data/setData.js'

/** 카테고리별 로컬 폴백(상세 기본값 defaultIndices 포함) — Firestore 문서에 없을 때 관리자 편집 표시용 */
const LOCAL_FALLBACK_BY_CATEGORY = {
  set: setProducts,
  camera: cameraProducts,
  lens: lensProducts,
  grip: gripProducts,
  light: lightProducts,
  monitor: monitorProducts,
  intercom: intercomProducts,
}

export function clampDefaultIndicesForItems(indices, itemCount) {
  if (!Array.isArray(indices) || !indices.length || !Number.isFinite(itemCount) || itemCount <= 0) {
    return []
  }
  return [
    ...new Set(
      indices
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 0 && n < itemCount),
    ),
  ]
}

/**
 * Firestore에서 불러온 options에 defaultIndices가 비어 있으면, 같은 id의 로컬 폴백에서 동일 순서 그룹의 기본값을 채웁니다.
 * 단, 문서에 `defaultIndices` 키가 이미 있으면(빈 배열 포함) 관리자가 저장한 값만 쓰고 폴백을 넣지 않습니다.
 */
export function mergeOptionsWithLocalFallback(category, productId, options) {
  if (!Array.isArray(options)) return []
  const key = String(category || '').trim().toLowerCase()
  const list = LOCAL_FALLBACK_BY_CATEGORY[key]
  const fallback = list?.find((p) => p.id === productId)
  const fbOpts = fallback?.options

  return options
    .filter((g) => g && typeof g === 'object')
    .map((g, groupIndex) => {
      const items = Array.isArray(g.items)
        ? g.items.map((it) => (typeof it === 'string' ? it : String(it ?? ''))).filter(Boolean)
        : []
      const group = String(g.group || '').trim()
      const entry = { group, items }
      const hasDefaultKey = Object.prototype.hasOwnProperty.call(g, 'defaultIndices')
      let idxs = clampDefaultIndicesForItems(g.defaultIndices, items.length)
      if (!hasDefaultKey && !idxs.length && Array.isArray(fbOpts) && fbOpts[groupIndex]) {
        idxs = clampDefaultIndicesForItems(fbOpts[groupIndex].defaultIndices, items.length)
      }
      if (hasDefaultKey) {
        entry.defaultIndices = clampDefaultIndicesForItems(g.defaultIndices, items.length)
      } else if (idxs.length) {
        entry.defaultIndices = idxs
      }
      return entry
    })
    .filter((g) => g.group)
}

function splitGroupAndItems(line) {
  const idx = line.indexOf(':')
  if (idx === -1) {
    return { groupPart: line.trim(), itemsPart: '' }
  }
  return {
    groupPart: line.slice(0, idx).trim(),
    itemsPart: line.slice(idx + 1),
  }
}

/**
 * 옵션 구분 쉼표만 분리.
 * 예: `+5,000` / `+ 70,000` 같은 금액 콤마는 유지해야 함.
 */
function splitOptionItems(itemsPart) {
  return String(itemsPart || '')
    // 항목 구분 콤마만 분리하고, 금액 표기의 천단위 콤마(+20,000)는 유지.
    // 다음 토큰에 "+숫자" 패턴이 포함될 때만 새 항목 시작으로 본다.
    .split(/,\s*(?=[^,\n]*\+\s*\d)/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseOptionsFromText(text) {
  if (!String(text || '').trim()) return []
  return String(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const { groupPart, itemsPart } = splitGroupAndItems(line)
      const rawItems = splitOptionItems(itemsPart)
      const items = []
      const defaultIndices = []
      for (const raw of rawItems) {
        let s = raw
        let marked = false
        if (s.startsWith('*')) {
          marked = true
          s = s.slice(1).trim()
        }
        if (!s) continue
        if (marked) defaultIndices.push(items.length)
        items.push(s)
      }
      return {
        group: groupPart,
        items,
        /** 빈 배열이어도 저장해 두면 로컬 폴백으로 기본값이 덮어씌워지지 않음 */
        defaultIndices: [...defaultIndices],
      }
    })
    .filter((entry) => entry.group)
}

export function serializeOptionsToText(options) {
  if (!Array.isArray(options)) return ''
  return options
    .map((entry) => {
      const items = Array.isArray(entry.items) ? entry.items : []
      const defSet = new Set(
        Array.isArray(entry.defaultIndices) ? entry.defaultIndices.map((n) => Number(n)) : [],
      )
      const parts = items.map((text, i) => {
        const t = typeof text === 'string' ? text : String(text ?? '')
        return defSet.has(i) ? `*${t}` : t
      })
      return `${entry.group || ''}: ${parts.join(', ')}`
    })
    .join('\n')
}
