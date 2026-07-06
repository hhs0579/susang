import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import AdminLoginPage from '../views/AdminLoginPage.vue'
import AdminDashboardPage from '../views/AdminDashboardPage.vue'
import AdminProductCreatePage from '../views/AdminProductCreatePage.vue'
import CameraListPage from '../views/CameraListPage.vue'
import CameraDetailPage from '../views/CameraDetailPage.vue'
import LensListPage from '../views/LensListPage.vue'
import LensDetailPage from '../views/LensDetailPage.vue'
import SupportListPage from '../views/SupportListPage.vue'
import SupportDetailPage from '../views/SupportDetailPage.vue'
import GripListPage from '../views/GripListPage.vue'
import GripDetailPage from '../views/GripDetailPage.vue'
import MonitorListPage from '../views/MonitorListPage.vue'
import MonitorDetailPage from '../views/MonitorDetailPage.vue'
import LightListPage from '../views/LightListPage.vue'
import LightDetailPage from '../views/LightDetailPage.vue'
import IntercomListPage from '../views/IntercomListPage.vue'
import IntercomDetailPage from '../views/IntercomDetailPage.vue'
import GenericCategoryListPage from '../views/GenericCategoryListPage.vue'
import GenericCategoryDetailPage from '../views/GenericCategoryDetailPage.vue'
import GuidePage from '../views/GuidePage.vue'
import DiscountPage from '../views/DiscountPage.vue'
import CategoryPage from '../views/CategoryPage.vue'
import SetListPage from '../views/SetListPage.vue'
import SetDetailPage from '../views/SetDetailPage.vue'
import { auth } from '../firebase'
import { findProductPathByRouteParam } from '../composables/useCategoryProducts'
import { applyRouteSeo } from '../utils/applySeo'
import { PRODUCT_CATEGORY_KEYS } from '../utils/productSlug'
import { isCopyPrefixedCategory, sanitizeCategoryKey } from '../utils/sanitizeCategoryKey'

const ADMIN_SESSION_KEY = 'susang_admin_logged_in'
const VALID_CATEGORY_SLUGS = new Set(PRODUCT_CATEGORY_KEYS)

function resolveCategoryListRoute(to) {
  const raw = String(to.params.slug || '').trim().toLowerCase()
  const clean = sanitizeCategoryKey(raw)

  if (clean && VALID_CATEGORY_SLUGS.has(clean)) {
    if (clean !== raw) return { path: `/${clean}`, replace: true }
    return true
  }

  const productPath = findProductPathByRouteParam(raw)
  if (productPath) return { path: productPath, replace: true }

  if (isCopyPrefixedCategory(raw) && clean && VALID_CATEGORY_SLUGS.has(clean)) {
    return { path: `/${clean}`, replace: true }
  }

  return { path: '/', replace: true }
}

function resolveLegacyProductRoute(to) {
  const category = sanitizeCategoryKey(to.params.slug)
  const param = String(to.params.id || '').trim().toLowerCase()

  if (category && VALID_CATEGORY_SLUGS.has(category)) {
    const productPath = findProductPathByRouteParam(param)
    if (productPath) return { path: productPath, replace: true }
    return true
  }

  const rootProductPath = findProductPathByRouteParam(category || param)
  if (rootProductPath) return { path: rootProductPath, replace: true }

  return { path: '/', replace: true }
}

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, left: 0, behavior: 'auto' }
  },
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/category/:slug', name: 'category-page', component: CategoryPage },
    { path: '/set', name: 'set-list', component: SetListPage, meta: { keepAlive: true } },
    { path: '/set/:id', name: 'set-detail', component: SetDetailPage },
    { path: '/camera', name: 'camera-list', component: CameraListPage, meta: { keepAlive: true } },
    { path: '/camera/:id', name: 'camera-detail', component: CameraDetailPage },
    { path: '/lens', name: 'lens-list', component: LensListPage, meta: { keepAlive: true } },
    { path: '/lens/:id', name: 'lens-detail', component: LensDetailPage },
    { path: '/support', name: 'support-list', component: SupportListPage, meta: { keepAlive: true } },
    { path: '/support/:id', name: 'support-detail', component: SupportDetailPage },
    { path: '/grip', name: 'grip-list', component: GripListPage, meta: { keepAlive: true } },
    { path: '/grip/:id', name: 'grip-detail', component: GripDetailPage },
    { path: '/monitor', name: 'monitor-list', component: MonitorListPage, meta: { keepAlive: true } },
    { path: '/monitor/:id', name: 'monitor-detail', component: MonitorDetailPage },
    { path: '/light', name: 'light-list', component: LightListPage, meta: { keepAlive: true } },
    { path: '/light/:id', name: 'light-detail', component: LightDetailPage },
    { path: '/intercom', name: 'intercom-list', component: IntercomListPage, meta: { keepAlive: true } },
    { path: '/intercom/:id', name: 'intercom-detail', component: IntercomDetailPage },
    { path: '/guide', name: 'guide', component: GuidePage },
    { path: '/discount', name: 'discount', component: DiscountPage },
    { path: '/admin', name: 'admin-login', component: AdminLoginPage },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardPage,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/products/new',
      name: 'admin-product-create',
      component: AdminProductCreatePage,
      meta: { requiresAdmin: true },
    },
    {
      path: '/:slug/:id',
      name: 'generic-category-detail',
      component: GenericCategoryDetailPage,
      beforeEnter: resolveLegacyProductRoute,
    },
    {
      path: '/:slug',
      name: 'category-page-slug',
      component: GenericCategoryListPage,
      meta: { keepAlive: true },
      beforeEnter: resolveCategoryListRoute,
    },
  ],
})

router.afterEach((to) => {
  applyRouteSeo(to)
})

router.beforeEach((to) => {
  const isSessionLoggedIn = localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  const isFirebaseLoggedIn = !!auth?.currentUser
  const isLoggedIn = isSessionLoggedIn || isFirebaseLoggedIn

  if (to.meta.requiresAdmin) {
    if (!isLoggedIn) return '/admin'
  }

  if (to.path === '/admin') {
    if (isLoggedIn) return '/admin/dashboard'
  }

  return true
})

export { ADMIN_SESSION_KEY }
export default router
