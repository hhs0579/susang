/**
 * Option group names from admin may embed "Single" / "Multiple" / "Y/N" for UI logic.
 * Detection always uses the raw string; labels use the cleaned title.
 */
export function isSingleOptionGroup(raw) {
  const t = String(raw || '')
  return /\bSingle\b/i.test(t) || /싱글/i.test(t)
}

export function displayOptionGroupTitle(raw) {
  const original = String(raw || '').trim()
  if (!original) return ''

  // 제로폭·BOM 등이 괄호 패턴을 깨는 경우 제거
  let s = original.replace(/[\u200B-\u200D\uFEFF]/g, '')

  // "(Single, Y)" → "(, Y)" 로 남는 경우가 있어, 단어 마커를 먼저 제거한 뒤 괄호 조각을 지운다.
  s = s.replace(/\bSingle\b/gi, '')
  s = s.replace(/\bMultiple\b/gi, '')
  s = s.replace(/\bMultiples\b/gi, '')
  s = s.replace(/\bMulti\b/gi, '')
  s = s.replace(/멀티플/gi, '')
  s = s.replace(/싱글/g, '')
  s = s.replace(/\by\s*\/\s*n\b/gi, '')
  s = s.replace(/\by\s*,\s*n\b/gi, '')

  // `(, Y)` `(, N)` `(，Ｙ)` 등
  const parenStripPatterns = [
    /[(（]\s*[,，、]\s*[^)）]{0,16}[)）]/g,
    /[(（]\s*[yYnNＹｙＮｎ\uFF39\uFF59\uFF2E\uFF4E]\s*\/\s*[yYnNＹｙＮｎ\uFF39\uFF59\uFF2E\uFF4E]\s*[)）]/gi,
    /[(（]\s*[yYnNＹｙ]\s*[,，]\s*[yYnNＹｙ]\s*[)）]/gi,
    /\(\s*,\s*[yYnN]\s*\)/g,
    /\(\s*,\s*[yYnN]\s*\/\s*[yYnN]\s*\)/gi,
    /\(\s*[yYnN]\s*\/\s*[yYnN]\s*\)/gi,
    /\(\s*[yYnN]\s*,\s*[yYnN]\s*\)/gi,
  ]
  let prevStrip
  do {
    prevStrip = s
    for (const re of parenStripPatterns) {
      s = s.replace(re, '')
    }
  } while (s !== prevStrip)

  s = s.replace(/\(\s*\)/g, '')

  s = s.replace(/[\s,;\/|]+$/g, '')
  s = s.replace(/^[\s,;\/|]+/g, '')
  s = s.replace(/\s{2,}/g, ' ').trim()

  if (s) return s
  return original
}
