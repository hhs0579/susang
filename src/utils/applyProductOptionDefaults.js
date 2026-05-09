/**
 * 관리자에서 저장한 defaultIndices(또는 옵션 텍스트의 `*` 접두)만 반영합니다.
 * defaultIndices가 없으면 해당 그룹은 비워 둡니다.
 */
export function normalizeDefaultIndices(rawGroup, itemCount) {
  const rawArr = rawGroup?.defaultIndices
  if (!Array.isArray(rawArr) || !rawArr.length) return []
  return [
    ...new Set(
      rawArr
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 0 && n < itemCount),
    ),
  ]
}

function resolveDefaultIndices(parsed, raw) {
  return normalizeDefaultIndices(raw, parsed.items.length)
}

/**
 * @param {Record<number, unknown>} selectedOptions
 * @param {Array<{ groupIndex: number, isSingle: boolean, items: Array<{ id: string, extraPrice?: number }> }>} parsedGroups
 * @param {Array<{ group?: string, items?: unknown[], defaultIndices?: number[] }>} rawGroups
 */
export function applyProductOptionDefaults(selectedOptions, parsedGroups, rawGroups) {
  if (!Array.isArray(rawGroups) || !Array.isArray(parsedGroups)) return

  rawGroups.forEach((raw, groupIndex) => {
    const parsed = parsedGroups[groupIndex]
    if (!parsed?.items?.length) return

    const idxs = resolveDefaultIndices(parsed, raw)
    if (!idxs.length) return

    if (parsed.isSingle) {
      const item = parsed.items[idxs[0]]
      if (item) selectedOptions[groupIndex] = item
      return
    }

    const chosen = idxs.map((i) => parsed.items[i]).filter(Boolean)
    if (chosen.length) selectedOptions[groupIndex] = chosen
  })
}
