<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatCurrency, useCategoryProducts, isOptionOnlyProduct, getMinOptionExtraPrice } from '../composables/useCategoryProducts'
import { displayOptionGroupTitle, isSingleOptionGroup } from '../utils/optionGroupLabels.js'
import { applyProductOptionDefaults } from '../utils/applyProductOptionDefaults.js'
import SiteHeader from '../components/SiteHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'

const route = useRoute()
const categoryKey = computed(() => String(route.params.slug || '').trim().toLowerCase())
const { getProductById } = useCategoryProducts(categoryKey.value, [])
const product = computed(() => getProductById(route.params.id))
const optionGroups = computed(() => product.value?.options || [])
const selectedImageIndex = ref(0)
const selectedOptions = reactive({})
const toastMessage = ref('')
let toastTimerId

const galleryImages = computed(() => {
  if (!product.value) return []
  return [product.value.image, ...(product.value.accessories || [])].filter(Boolean)
})

const selectedImage = computed(() => galleryImages.value[selectedImageIndex.value] || '')

function parseOptionEntry(entry) {
  const match = entry.match(/\+([\d,]+)\s*$/)
  const extraPrice = match ? Number(match[1].replaceAll(',', '')) : 0
  const label = entry.replace(/\s*\+[\d,]+\s*$/, '').trim()
  return { label, extraPrice }
}

const parsedOptionGroups = computed(() =>
  optionGroups.value.map((group, groupIndex) => ({
    groupIndex,
    rawGroup: group.group,
    title: displayOptionGroupTitle(group.group),
    isSingle: isSingleOptionGroup(group.group),
    items: (group.items || []).map((entry, itemIndex) => {
      const parsed = parseOptionEntry(entry)
      return { ...parsed, id: `${groupIndex}-${itemIndex}` }
    }),
  })),
)

const hasComponentList = computed(() => Array.isArray(product.value?.baseComponents) && product.value.baseComponents.length > 0)
const hasDetailSelect = computed(() => parsedOptionGroups.value.length > 0)

const selectedExtraPrice = computed(() => {
  let total = 0
  parsedOptionGroups.value.forEach((group) => {
    const selected = selectedOptions[group.groupIndex]
    if (!selected) return
    if (group.isSingle) {
      total += selected.extraPrice || 0
      return
    }
    selected.forEach((item) => {
      total += item.extraPrice || 0
    })
  })
  return total
})

const basePriceForCalc = computed(() => {
  if (hasDetailSelect.value && !hasComponentList.value) return 0
  return Number(product.value?.originalPrice || product.value?.discountPrice || 0)
})

const totalPrice = computed(() => basePriceForCalc.value + selectedExtraPrice.value)
const hasDiscountPrice = computed(
  () => Number(product.value?.originalPrice || 0) > Number(product.value?.discountPrice || 0),
)
const displayPrice = computed(() => {
  if (isOptionOnlyProduct(product.value)) {
    const min = getMinOptionExtraPrice(product.value)
    return min > 0 ? min : 0
  }
  return hasDiscountPrice.value
    ? Number(product.value?.discountPrice || 0)
    : Number(product.value?.originalPrice || product.value?.discountPrice || 0)
})

function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`
}

function selectImage(index) {
  selectedImageIndex.value = index
}

function showPrevImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value =
    (selectedImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

function showNextImage() {
  if (!galleryImages.value.length) return
  selectedImageIndex.value = (selectedImageIndex.value + 1) % galleryImages.value.length
}

function isSelected(group, item) {
  const selected = selectedOptions[group.groupIndex]
  if (!selected) return false
  if (group.isSingle) return selected.id === item.id
  return selected.some((entry) => entry.id === item.id)
}

function toggleOption(group, item) {
  if (group.isSingle) {
    const cur = selectedOptions[group.groupIndex]
    if (cur && cur.id === item.id) {
      delete selectedOptions[group.groupIndex]
      return
    }
    selectedOptions[group.groupIndex] = item
    return
  }
  const selected = selectedOptions[group.groupIndex] || []
  const exists = selected.some((entry) => entry.id === item.id)
  selectedOptions[group.groupIndex] = exists
    ? selected.filter((entry) => entry.id !== item.id)
    : [...selected, item]
}

function getSelectedItems(group) {
  const selected = selectedOptions[group.groupIndex]
  if (!selected) return []
  return group.isSingle ? [selected] : selected
}

function buildOptionShareText() {
  const lines = [`[${product.value?.name || ''}] 선택 구성`]
  const groups = parsedOptionGroups.value
  if (!groups.length) {
    lines.push('추가 옵션: 없음')
    return lines.join('\n')
  }

  lines.push('추가 옵션:')
  groups.forEach((group) => {
    const header = group.title || group.rawGroup
    const items = getSelectedItems(group)
    if (!items.length) {
      lines.push(`- ${header}: (선택 없음)`)
      return
    }
    const itemText = items
      .map((item) => `${item.label}${item.extraPrice ? ` (+${formatWon(item.extraPrice)})` : ''}`)
      .join(', ')
    lines.push(`- ${header}: ${itemText}`)
  })
  return lines.join('\n')
}

async function copyOptionSummary() {
  if (!product.value) return
  try {
    await navigator.clipboard.writeText(buildOptionShareText())
    showToast('복사되었습니다')
  } catch {
    showToast('복사에 실패했습니다')
  }
}

function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimerId)
  toastTimerId = setTimeout(() => {
    toastMessage.value = ''
  }, 1800)
}

watch(
  () => [route.params.slug, route.params.id, product.value?.id, product.value?.options],
  async () => {
    selectedImageIndex.value = 0
    Object.keys(selectedOptions).forEach((key) => delete selectedOptions[key])
    await nextTick()
    if (!product.value) return
    applyProductOptionDefaults(selectedOptions, parsedOptionGroups.value, optionGroups.value)
  },
  { immediate: true },
)
</script>

<template>
  <main v-if="product" class="camera-detail-page">
    <SiteHeader />

    <section class="detail-wrap">
      <div class="detail-left">
        <RouterLink :to="`/${categoryKey}`" class="back-link">&lt; Back to Category</RouterLink>
        <div class="detail-main-image">
          <button type="button" class="image-nav image-nav-left" @click="showPrevImage">&lt;</button>
          <img :src="selectedImage" :alt="product.name" fetchpriority="high" decoding="async" />
          <button type="button" class="image-nav image-nav-right" @click="showNextImage">&gt;</button>
        </div>
        <div class="detail-sub-images">
          <button
            v-for="(item, index) in galleryImages"
            :key="`${item}-${index}`"
            type="button"
            class="detail-sub-thumb"
            :class="{ active: selectedImageIndex === index }"
            @click="selectImage(index)"
          >
            <img
              :src="item"
              :alt="`${product.name} image ${index + 1}`"
              loading="lazy"
              decoding="async"
            />
          </button>
          <div v-if="!galleryImages.length" class="detail-sub-thumb empty-thumb">이미지 없음</div>
        </div>
      </div>

      <div class="detail-right">
        <p class="detail-brand">{{ product.section }}</p>
        <div class="detail-title-row">
          <h1>{{ product.name }}</h1>
          <p v-if="product.titleExtraText" class="detail-title-extra">{{ product.titleExtraText }}</p>
        </div>
        <p v-if="hasDiscountPrice && !product.priceDisplayText" class="detail-original">{{ formatWon(product.originalPrice) }}</p>
        <p class="detail-price">{{ product.priceDisplayText || formatWon(displayPrice) }}</p>

        <h2 v-if="hasComponentList">COMPONENT LIST</h2>
        <ul v-if="hasComponentList" class="component-box">
                    <li v-for="component in product.baseComponents" :key="component">{{ component }}</li>
        </ul>

        <div v-if="hasDetailSelect" class="detail-select-header">
          <h2>DETAIL SELECT</h2>
        </div>
        <div v-if="hasDetailSelect" class="option-panels">
          <details v-for="group in parsedOptionGroups" :key="group.groupIndex" class="option-panel" open>
            <summary>{{ group.title }}</summary>
            <ul class="option-list">
              <li v-for="item in group.items" :key="item.id">
                <button
                  type="button"
                  class="option-choice"
                  :class="{ active: isSelected(group, item) }"
                  @click="toggleOption(group, item)"
                >
                  <span>{{ item.label }}</span>
                  <b>{{ item.extraPrice ? `+${formatCurrency(item.extraPrice)}` : '+₩0' }}</b>
                </button>
              </li>
            </ul>
          </details>
        </div>

        <div class="detail-checkout">
          <strong>{{ formatWon(totalPrice) }}</strong>
        </div>

      </div>

      <div
        v-if="product.detailFooterText || (Array.isArray(product.detailFooterImages) && product.detailFooterImages.length)"
        class="detail-footer-band"
      >
        <div class="detail-footer-content">
          <p v-if="product.detailFooterText" class="detail-footer-text">{{ product.detailFooterText }}</p>
          <div
            v-if="Array.isArray(product.detailFooterImages) && product.detailFooterImages.length"
            class="detail-footer-images"
          >
            <img
              v-for="(image, index) in product.detailFooterImages"
              :key="`detail-footer-${index}-${image}`"
              :src="image"
              :alt="`${product.name} detail extra ${index + 1}`"
              class="detail-footer-image"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </main>

  <main v-else class="camera-not-found">
    <h1>상품을 찾을 수 없습니다.</h1>
    <RouterLink :to="`/${categoryKey}`">{{ categoryKey.toUpperCase() }} 목록으로 돌아가기</RouterLink>
  </main>

  <div
    v-if="toastMessage"
    style="
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      z-index: 2000;
      background: rgba(0, 0, 0, 0.82);
      color: #fff;
      padding: 10px 16px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: -0.01em;
    "
  >
    {{ toastMessage }}
  </div>
</template>
