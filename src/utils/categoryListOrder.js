/**
 * 카테고리 목록(상세 진입 전 그리드) 표시 순서.
 * Firestore `order`가 있으면 그 값이 1순위이고, 없으면 아래 이름 고정 목록·섹션 규칙을 씁니다.
 */

export function normListName(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[\u2018\u2019\u201A\u2032\u2035]/g, "'")
    .trim()
}

export function sortByNameOrder(products, preferredNames) {
  const orderMap = new Map(preferredNames.map((n, i) => [normListName(n), i]))
  return [...products].sort((a, b) => {
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    const na = normListName(a.name)
    const nb = normListName(b.name)
    const ia = orderMap.has(na) ? orderMap.get(na) : Number.MAX_SAFE_INTEGER
    const ib = orderMap.has(nb) ? orderMap.get(nb) : Number.MAX_SAFE_INTEGER
    if (ia !== ib) return ia - ib
    return na.localeCompare(nb, 'en')
  })
}

const SET_ALL_ORDER = [
  'SONY VENICE2',
  'ARRI ALEXA 35',
  'ARRI ALEXA MINI LF',
  'ARRI ALEXA MINI',
  'SONY BURANO FULL SET ver.2',
  'SONY BURANO FULL SET ver.1',
  'ARRI AMIRA',
  'CANON C400 FULL SET',
  'SONY FX9 FULL SET',
  'SONY FX6 FULL SET',
  'CANON C80 FULL SET',
]

export function sortSetListProducts(products) {
  return sortByNameOrder(products, SET_ALL_ORDER)
}

const CAMERA_ALL_ORDER = [
  'SONY BURANO',
  'CANON C400',
  'SONY FX9',
  'SONY FX6',
  'CANON C80',
  'CANON C50',
  'SONY A7S3',
  'CANON R6M3',
  'OSMO ACTION6',
  'SONY ZV-1M2',
]

export function sortCameraListProducts(products) {
  return sortByNameOrder(products, CAMERA_ALL_ORDER)
}

const LENS_ALL_ORDER = [
  'SIGNATURE PRIME LENS SET',
  'MERCURY LENS SET',
  'NANO PRIME LENS SET',
  'COOKE SP3 LENS SET',
  'DZOFILM ARLES PRIME LENS SET',
  'ULTRA PRIME LENS SET',
  'CANON CN-E PRIME LENS SET',
  'ZEISS CP.3 LENS SET',
  'ZEISS ZENA FLEKTOGON LENS SET',
  'SAMYANG XEEN LENS SET',
  'ALURA ZOOM 18-80mm',
  'HD-EC ZOOM LENS HJ21x7.5B-III',
  'EZ-1 30-90mm T2.0 S35',
  'EZ-1 45-135mm T3.0 FF',
  'EZ-2 15-40mm T2.0 S35',
  'EZ-2 22-60mm T3.0 FF',
  'FUJINON CABRIO 85-300mm',
  'ANGENIEUX HR 25-250mm T3.5',
  '8-15mm T2.9 FF Zoom Fisheye Cine PL',
  '9mm T5.8 VV Cine PL',
  '10mm T2.9 Zero-D VV Cine PL',
  '12mm T2.9 Lite Zero-D VV Cine PL',
  'Laowa Probe Zoom 15-24mm T8',
  'Laowa 24mm f/14 Probe Lens',
  'FF 100mm T2.9 Macro 2X APO Cine',
  'SONY FE GM PRIME LENS SET',
  'SONY FE 14mm f1.8 GM',
  'SONY FE 24mm f1.4 GM',
  'SONY FE 35mm f1.4 GM',
  'SONY FE 50mm f1.4 GM',
  'SONY FE 85mm f1.4 GM II',
  'SONY FE 100mm f2.8 Macro GM OSS',
  'SONY FE 135mm f1.4 GM',
  'CANON RF LENS SET',
  'RF100-500mm f4.5-7.1 L IS USM',
  'RF70-200mm f2.8 L IS USM',
  'RF24-105mm f2.8 L IS USM Z',
  'RF 24-70mm f2.8 L IS USM',
  'RF15-35mm f2.8 L IS USM',
  'SONY FE GM II LENS SET',
  'SONY GM LENS SET',
  'SONY FE 100-400mm f4.5-5.6GM OSS',
  'SONY FE 70-200mm f2.8GM OSS II',
  'SONY FE 70-200mm f2.8GM',
  'SONY FE 24-70mm f2.8GM II',
  'SONY FE 24-70mm f2.8GM',
  'SONY FE 16-35mm f2.8GM II',
  'SONY FE 16-35mm f2.8GM',
  'SONY FE 12-24mm f2.8GM',
  'BAVEYES B4 > PL S35 Expander',
  'BAVEYES PL > PL 2x Extender',
  'ARRI EF Mount',
  'Metabones PL to E-Mount T Cine',
  'Metabones EF to E-Mount',
]

const LENS_PRIME_ORDER = [
  'SIGNATURE PRIME LENS SET',
  'MERCURY LENS SET',
  'NANO PRIME LENS SET',
  'COOKE SP3 LENS SET',
  'DZOFILM ARLES PRIME LENS SET',
  'ULTRA PRIME LENS SET',
  'CANON CN-E PRIME LENS SET',
  'ZEISS CP.3 LENS SET',
  'ZEISS ZENA FLEKTOGON LENS SET',
  'SAMYANG XEEN LENS SET',
  '9mm T5.8 VV Cine PL',
  '10mm T2.9 Zero-D VV Cine PL',
  '12mm T2.9 Lite Zero-D VV Cine PL',
  'Laowa 24mm f/14 Probe Lens',
  'FF 100mm T2.9 Macro 2X APO Cine',
]

const LENS_ZOOM_ORDER = [
  'ALURA ZOOM 18-80mm',
  'HD-EC ZOOM LENS HJ21x7.5B-III',
  'EZ-1 30-90mm T2.0 S35',
  'EZ-1 45-135mm T3.0 FF',
  'EZ-2 15-40mm T2.0 S35',
  'EZ-2 22-60mm T3.0 FF',
  'FUJINON CABRIO 85-300mm',
  'ANGENIEUX HR 25-250mm T3.5',
  '8-15mm T2.9 FF Zoom Fisheye Cine PL',
  'Laowa Probe Zoom 15-24mm T8',
]

const LENS_EMOUNT_ORDER = [
  'SONY FE GM PRIME LENS SET',
  'SONY FE 14mm f1.8 GM',
  'SONY FE 24mm f1.4 GM',
  'SONY FE 35mm f1.4 GM',
  'SONY FE 50mm f1.4 GM',
  'SONY FE 85mm f1.4 GM II',
  'SONY FE 100mm f2.8 Macro GM OSS',
  'SONY FE 135mm f1.4 GM',
  'SONY FE GM II LENS SET',
  'SONY GM LENS SET',
  'SONY FE 100-400mm f4.5-5.6GM OSS',
  'SONY FE 70-200mm f2.8GM OSS II',
  'SONY FE 70-200mm f2.8GM',
  'SONY FE 24-70mm f2.8GM II',
  'SONY FE 24-70mm f2.8GM',
  'SONY FE 16-35mm f2.8GM II',
  'SONY FE 16-35mm f2.8GM',
  'SONY FE 12-24mm f2.8GM',
]

const LENS_RF_ORDER = [
  'CANON RF LENS SET',
  'RF100-500mm f4.5-7.1 L IS USM',
  'RF70-200mm f2.8 L IS USM',
  'RF24-105mm f2.8 L IS USM Z',
  'RF 24-70mm f2.8 L IS USM',
  'RF15-35mm f2.8 L IS USM',
]

const LENS_ADAPTER_ORDER = [
  'BAVEYES B4 > PL S35 Expander',
  'BAVEYES PL > PL 2x Extender',
  'ARRI EF Mount',
  'Metabones PL to E-Mount T Cine',
  'Metabones EF to E-Mount',
]

export function sortLensListProducts(products, subCategoryLabel) {
  const map = {
    ALL: LENS_ALL_ORDER,
    'Prime Lens': LENS_PRIME_ORDER,
    'Zoom Lens': LENS_ZOOM_ORDER,
    'E Mount': LENS_EMOUNT_ORDER,
    'RF Mount': LENS_RF_ORDER,
    Adapter: LENS_ADAPTER_ORDER,
  }
  return sortByNameOrder(products, map[subCategoryLabel] || LENS_ALL_ORDER)
}

const SUPPORT_WIRELESS_ORDER = ['HI-5 SX', 'NUCLEUS-M II', 'NUCLEUS-M']
const SUPPORT_MATTEBOX_ORDER = ['LMB 4X5', 'MB-T12', 'MISFIT ATOM', 'MISFIT KICK', 'MB-T16 MIRAGE MATTEBOX']
const SUPPORT_FILTER_ORDER = [
  'IRND',
  'CLEAR',
  'PL',
  'Hollywood Black Magic',
  'Black Frost',
  'Digicon',
  'Radiant Soft',
  'Black Satin',
  'Soft FX',
  'Black Glimmer Glass',
  'Ultra Contrast',
  'Low Contrast',
  '138mm Full Field Close-Up Diopter',
  '138mm Wormhole',
  'Centerfield Split Diopter 82mm',
  'Revoring 67-82mm Variable ND+CPL',
]

function supportSectionRank(item) {
  const s = String(item?.section || '').toUpperCase()
  if (s.includes('WIRELESS')) return 0
  if (s.includes('MATTEBOX')) return 1
  if (s.includes('FILTER')) return 2
  return 3
}

function supportOrderListForItem(item) {
  const r = supportSectionRank(item)
  if (r === 0) return SUPPORT_WIRELESS_ORDER
  if (r === 1) return SUPPORT_MATTEBOX_ORDER
  return SUPPORT_FILTER_ORDER
}

export function sortSupportListProducts(products) {
  return [...products].sort((a, b) => {
    const ra = supportSectionRank(a)
    const rb = supportSectionRank(b)
    if (ra !== rb) return ra - rb
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    const la = supportOrderListForItem(a)
    const lb = supportOrderListForItem(b)
    const ia = la.map(normListName).indexOf(normListName(a.name))
    const ib = lb.map(normListName).indexOf(normListName(b.name))
    const fa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const fb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    if (fa !== fb) return fa - fb
    return normListName(a.name).localeCompare(normListName(b.name), 'en')
  })
}

const GRIP_ALL_ORDER = [
  'MOVI PRO + IGNITE DIGI',
  'RONIN2',
  'VARY DOLLY + MINIJIB',
  'BABYJIB',
  'All-Terrain Rickshaw',
  'EASYRIG VARIO5 STABIL G3',
  'EASYRIG VARIO5 STABIL G2',
  'EASYRIG CINEMA3 750N',
  'RAZOR ARM',
  'CAM TANK',
  'SLIDER 120',
  'GRIP DOLLY PRO KIT',
  'SLIDER 5FT',
  'RS4 PRO',
  'SEGWAY NINEBOT S PLUS',
  'SHOULDER RIG V3',
  'CAMERA SADDLE',
  'RONIN RING GRIP',
  '9+9 HEAD SET',
  '25II HEAD SET',
  '100mm HEAD SET',
  'AKTIV6 + FLOWTECH',
  'ACE M',
  'CINE CART',
  'WAGON',
]

const GRIP_GIMBAL_ORDER = [
  'MOVI PRO + IGNITE DIGI',
  'RONIN2',
  'RS4 PRO',
  'RONIN RING GRIP',
]

const GRIP_GRIP_ONLY_ORDER = [
  'VARY DOLLY + MINIJIB',
  'BABYJIB',
  'All-Terrain Rickshaw',
  'EASYRIG VARIO5 STABIL G3',
  'EASYRIG VARIO5 STABIL G2',
  'EASYRIG CINEMA3 750N',
  'RAZOR ARM',
  'CAM TANK',
  'SLIDER 120',
  'GRIP DOLLY PRO KIT',
  'SLIDER 5FT',
  'SEGWAY NINEBOT S PLUS',
  'SHOULDER RIG V3',
  'CAMERA SADDLE',
]

const GRIP_TRIPOD_ORDER = ['9+9 HEAD SET', '25II HEAD SET', '100mm HEAD SET', 'AKTIV6 + FLOWTECH', 'ACE M']

const GRIP_CART_ORDER = ['CINE CART', 'WAGON']

export function sortGripListProducts(products, subCategoryLabel) {
  const map = {
    ALL: GRIP_ALL_ORDER,
    Gimbal: GRIP_GIMBAL_ORDER,
    Grip: GRIP_GRIP_ONLY_ORDER,
    Tripod: GRIP_TRIPOD_ORDER,
    Cart: GRIP_CART_ORDER,
  }
  return sortByNameOrder(products, map[subCategoryLabel] || GRIP_ALL_ORDER)
}

const MONITOR_WIRELESS_ORDER = [
  'TERADEK Bolt 4K LT',
  'TERADEK Bolt 6 LT',
  'TERADEK Bolt 1000XT',
  'TERADEK Bolt 500XT',
  'TERADEK SERV Pro',
  'SDR TRANSMISSION',
]

const MONITOR_57_ORDER = [
  `Blackmagic Video Assist 7" 12G`,
  `Blackmagic Video Assist 5" 3G`,
  'F-7HS',
  'F-7H',
  'F-5A',
  'CINE7',
  'INDIE7',
  'INDIE7 BOLT 4K RX',
]

const MONITOR_DIRECTOR_ORDER = ['CINE 18', 'SUMO 19SE', 'FM-215HDR', 'LVM-180A']

const MONITOR_ACC_ORDER = [
  'FOCUS GRIP',
  'WHEEL BASE',
  'MULTIVIEW 4 HD',
  'MICRO SDI TO HDMI',
  'UltraStudio Recorder SET',
]

function monitorSectionRank(item) {
  const s = String(item?.section || '').toUpperCase()
  if (s === 'WIRELESS TRANSCEIVER' || s === 'WIRELESS MONITOR' || (s.includes('WIRELESS') && !s.includes("5'")))
    return 0
  if (s === "5' 7' MONITOR" || s === "5'7' MONITOR" || s.includes("5'7'") || s.includes("5' 7'")) return 1
  if (s.includes('DIRECTOR')) return 2
  if (s.includes('MONITOR ACC') || s.includes('ACC')) return 3
  return 4
}

function monitorOrderListForItem(item) {
  const r = monitorSectionRank(item)
  if (r === 0) return MONITOR_WIRELESS_ORDER
  if (r === 1) return MONITOR_57_ORDER
  if (r === 2) return MONITOR_DIRECTOR_ORDER
  return MONITOR_ACC_ORDER
}

export function sortMonitorListProducts(products) {
  return [...products].sort((a, b) => {
    const ra = monitorSectionRank(a)
    const rb = monitorSectionRank(b)
    if (ra !== rb) return ra - rb
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    const la = monitorOrderListForItem(a)
    const ia = la.map(normListName).indexOf(normListName(a.name))
    const ib = la.map(normListName).indexOf(normListName(b.name))
    const fa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const fb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    if (fa !== fb) return fa - fb
    return normListName(a.name).localeCompare(normListName(b.name), 'en')
  })
}

const LIGHT_PANEL_ORDER = [
  'SKYPANEL S360-C',
  'INFINIMAT 4X4',
  'NOVA II 2X1',
  'NOVA P600C',
  'MOSAIC 4X4',
  'PAVOSLIM 360C',
  'F22C',
  'PAVOSLIM 240C',
  'ALIEN 300C',
  'PAVOSLIM 120C',
  'ALL-IN2 100W',
]

const LIGHT_SPOT_ORDER = [
  'EVOKE 2400B',
  'STORM 1200X',
  'EVOKE 900C',
  'STORM 700X',
  'STORM 400X',
  'STORM 80C',
  '60X',
  'Q8',
  'Q5',
  'P3',
]

const LIGHT_MODIFIERS_ORDER = [
  'PJ-NLM-15-30',
  'FL-35E',
  'FL-28',
  'CT120',
  'SIDUS ONE',
  'SPOTLIGHT MOUNT MAX 36°',
  'SPOTLIGHT MOUNT 36°',
  'SPOTLIGHT MINIZOOM',
  'SPOTLIGHT MINI 19°',
  'CF10',
  'CF7',
  'CF4',
  'F10 FRESNEL',
  '26° REFLECTOR',
  '30° REFLECTOR',
  'PARABOLIC 150',
  'LANTERN 120',
  'LIGHT DOME II',
  'LANTERN 30',
  'P600C SOFTBOX',
  'ASTERA SNAPGRID',
]

const LIGHT_PRACTICAL_ORDER = [
  'AX1 PIXELTUBE KIT',
  'PAVOTUBE II 30C 2KIT',
  'PAVOTUBE II 15C 1KIT',
  'AMARAN PT2C',
  'AMARAN T2C',
  'MTPRO',
  'MC PRO 8KIT',
  'B7C 8KIT',
  'B7C BULB',
  '가로등',
]

const LIGHT_ARM_ORDER = [
  'MIDDLE MAX MENACE ARM',
  'MINIMAX',
  'DOUBLE MENACE ARM',
  'SINGLE MENACE ARM',
  'D650 JUNIOR BOOM ARM',
  'C BOOM',
]

const LIGHT_GRIP_ORDER = [
  'Z-390 FAZER',
  'MEDIUM KIT',
  'JUNIOR STAND EXTENSION',
  '사다리',
  'MATTHPOLES',
  'B6040X SUPER WIND UP STAND',
  'B6029X SUPER WIND UP STAND LOW BASE',
  'B6039CS WIND UP STAND',
  'COMBO',
  'BABY COMBO',
  'A STAND',
  'C STAND',
  'JUNIOR MULTI HEADER',
  'BABY DOUBLE HEADER',
  'BATON GRIP',
  'SUPER CLAMP',
  'MATTHELLINI',
  'FOAMCORE CLAMP',
  'PONY CLAMP',
  'SANDBAG',
  '16A LINE 20m',
]

const LIGHT_BATTERY_ORDER = [
  'MG8000iSE 발전기',
  'DELTA MAX 2000',
  'DELTA 1300 POWER STATION',
  '390W V-MOUNT BP',
  'GEN 290W V-MOUNT BP 2SET',
  'CUBE BANK',
  'G-VT300',
]

const LIGHT_SCRIM_ORDER = [
  'LIGHTSTREAM MIRROR 4SET',
  'SMALL EFLECT REFLECTOR KIT',
  "12'X12' FRAME SET",
  "12'X12' ULTRA BOUNCE",
  "8'X8' DIFFUSION SET",
  '48”X48” ULTRA BOUNCE',
  '48”X48” VINYL',
  '48”X48” GRID',
  '48”X48” DIFFUSION',
  '48”X48” FLOPPY',
  '36”X36” DIFFUSION',
  '36”X36” FLOPPY',
  'POLYBOARD',
]

function lightSectionRank(item) {
  const s = String(item?.section || '').toUpperCase()
  if (s.includes('LED PANEL')) return 0
  if (s.includes('LED SPOT-SOURCE')) return 1
  if (s.includes('LED MODIFIERS')) return 2
  if (s.includes('LED LIKE PRACTICAL')) return 3
  if (s.includes('LIGHT ARM SET')) return 4
  if (s.includes('LIGHT GRIP')) return 5
  if (s.includes('BATTERY SYSTEM')) return 6
  if (s.includes('LIGHT SCRIM')) return 7
  return 8
}

function lightOrderListForItem(item) {
  const r = lightSectionRank(item)
  const lists = [
    LIGHT_PANEL_ORDER,
    LIGHT_SPOT_ORDER,
    LIGHT_MODIFIERS_ORDER,
    LIGHT_PRACTICAL_ORDER,
    LIGHT_ARM_ORDER,
    LIGHT_GRIP_ORDER,
    LIGHT_BATTERY_ORDER,
    LIGHT_SCRIM_ORDER,
  ]
  return lists[r] || LIGHT_PANEL_ORDER
}

export function sortLightListProducts(products) {
  return [...products].sort((a, b) => {
    const ra = lightSectionRank(a)
    const rb = lightSectionRank(b)
    if (ra !== rb) return ra - rb
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    const la = lightOrderListForItem(a)
    const ia = la.map(normListName).indexOf(normListName(a.name))
    const ib = la.map(normListName).indexOf(normListName(b.name))
    const fa = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const fb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    if (fa !== fb) return fa - fb
    return normListName(a.name).localeCompare(normListName(b.name), 'en')
  })
}

function lightSubKeyFromLabel(label) {
  const t = String(label || '')
  if (t === 'LED Panel') return 0
  if (t === 'LED Spot-Source') return 1
  if (t === 'LED Modifiers') return 2
  if (t === 'LED Like Practical') return 3
  if (t === 'Light Arm Set') return 4
  if (t === 'Light Grip') return 5
  if (t === 'Battery System') return 6
  if (t === 'Light Scrim') return 7
  return -1
}

export function sortLightListProductsForSub(products, lightSubCategoryLabel) {
  const key = lightSubKeyFromLabel(lightSubCategoryLabel)
  if (key < 0) return sortLightListProducts(products)
  const lists = [
    LIGHT_PANEL_ORDER,
    LIGHT_SPOT_ORDER,
    LIGHT_MODIFIERS_ORDER,
    LIGHT_PRACTICAL_ORDER,
    LIGHT_ARM_ORDER,
    LIGHT_GRIP_ORDER,
    LIGHT_BATTERY_ORDER,
    LIGHT_SCRIM_ORDER,
  ]
  return sortByNameOrder(products, lists[key] || LIGHT_PANEL_ORDER)
}

const INTERCOM_ORDER = ['SOLIDCOM SE', 'T82 EXTREME']

export function sortIntercomListProducts(products) {
  return sortByNameOrder(products, INTERCOM_ORDER)
}

function lensSortLabelFromAdminSection(sectionFilter) {
  if (!sectionFilter || sectionFilter === 'ALL') return 'ALL'
  const u = String(sectionFilter).toUpperCase()
  if (u === 'PRIME LENS') return 'Prime Lens'
  if (u === 'ZOOM LENS') return 'Zoom Lens'
  if (u === 'E MOUNT') return 'E Mount'
  if (u === 'RF MOUNT') return 'RF Mount'
  if (u === 'ADAPTER' || u === 'ACC') return 'Adapter'
  return 'ALL'
}

function gripSortLabelFromAdminSection(sectionFilter) {
  if (!sectionFilter || sectionFilter === 'ALL') return 'ALL'
  const u = String(sectionFilter).toUpperCase()
  if (u.includes('GIMBAL')) return 'Gimbal'
  if (u.includes('TRIPOD')) return 'Tripod'
  if (u.includes('CART')) return 'Cart'
  if (u.includes('GRIP')) return 'Grip'
  return 'ALL'
}

function lightSubLabelFromAdminSection(sectionFilter) {
  if (!sectionFilter || sectionFilter === 'ALL') return null
  const s = String(sectionFilter).toUpperCase()
  if (s.includes('LED PANEL')) return 'LED Panel'
  if (s.includes('LED SPOT-SOURCE') || s.includes('SPOT-SOURCE')) return 'LED Spot-Source'
  if (s.includes('LED MODIFIERS')) return 'LED Modifiers'
  if (s.includes('LED LIKE PRACTICAL')) return 'LED Like Practical'
  if (s.includes('LIGHT ARM SET')) return 'Light Arm Set'
  if (s.includes('LIGHT GRIP')) return 'Light Grip'
  if (s.includes('BATTERY SYSTEM')) return 'Battery System'
  if (s.includes('LIGHT SCRIM')) return 'Light Scrim'
  return null
}

/**
 * 관리자 상품 목록 정렬 — 사용자 사이트 목록(카테고리별 그리드)과 동일한 순서 규칙.
 * Firestore `order`가 있으면 사용자 사이트·관리자 모두에서 1순위로 적용됩니다.
 */
export function sortAdminProducts(categoryKey, sectionFilter, products) {
  if (!Array.isArray(products) || !products.length) return products
  const cat = String(categoryKey || '').toLowerCase().trim()
  const filt = String(sectionFilter || 'ALL').trim()

  if (cat === 'set') return sortSetListProducts(products)
  if (cat === 'camera') return sortCameraListProducts(products)
  if (cat === 'lens') {
    const label = filt === 'ALL' ? 'ALL' : lensSortLabelFromAdminSection(filt)
    return sortLensListProducts(products, label)
  }
  if (cat === 'support') return sortSupportListProducts(products)
  if (cat === 'grip') {
    const label = filt === 'ALL' ? 'ALL' : gripSortLabelFromAdminSection(filt)
    return sortGripListProducts(products, label)
  }
  if (cat === 'monitor') return sortMonitorListProducts(products)
  if (cat === 'intercom') return sortIntercomListProducts(products)
  if (cat === 'light') {
    if (filt === 'ALL') return sortLightListProducts(products)
    const sub = lightSubLabelFromAdminSection(filt)
    if (sub) return sortLightListProductsForSub(products, sub)
    return sortLightListProducts(products)
  }

  return [...products].sort((a, b) => {
    const oa = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER
    const ob = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER
    if (oa !== ob) return oa - ob
    return normListName(a.name).localeCompare(normListName(b.name), 'en')
  })
}
