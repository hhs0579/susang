import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import AdminLoginPage from '../views/AdminLoginPage.vue'
import AdminDashboardPage from '../views/AdminDashboardPage.vue'
import AdminProductCreatePage from '../views/AdminProductCreatePage.vue'
import CameraListPage from '../views/CameraListPage.vue'
import CameraDetailPage from '../views/CameraDetailPage.vue'
import LensListPage from '../views/LensListPage.vue'
import LensDetailPage from '../views/LensDetailPage.vue'
import GripListPage from '../views/GripListPage.vue'
import GripDetailPage from '../views/GripDetailPage.vue'
import MonitorListPage from '../views/MonitorListPage.vue'
import MonitorDetailPage from '../views/MonitorDetailPage.vue'
import IntercomListPage from '../views/IntercomListPage.vue'
import IntercomDetailPage from '../views/IntercomDetailPage.vue'
import GuidePage from '../views/GuidePage.vue'
import CategoryPage from '../views/CategoryPage.vue'
import SetListPage from '../views/SetListPage.vue'
import SetDetailPage from '../views/SetDetailPage.vue'
import { auth } from '../firebase'

const ADMIN_SESSION_KEY = 'susang_admin_logged_in'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/category/:slug', name: 'category-page', component: CategoryPage },
    { path: '/set', name: 'set-list', component: SetListPage },
    { path: '/set/:id', name: 'set-detail', component: SetDetailPage },
    { path: '/camera', name: 'camera-list', component: CameraListPage },
    { path: '/camera/:id', name: 'camera-detail', component: CameraDetailPage },
    { path: '/lens', name: 'lens-list', component: LensListPage },
    { path: '/lens/:id', name: 'lens-detail', component: LensDetailPage },
    { path: '/grip', name: 'grip-list', component: GripListPage },
    { path: '/grip/:id', name: 'grip-detail', component: GripDetailPage },
    { path: '/monitor', name: 'monitor-list', component: MonitorListPage },
    { path: '/monitor/:id', name: 'monitor-detail', component: MonitorDetailPage },
    { path: '/intercom', name: 'intercom-list', component: IntercomListPage },
    { path: '/intercom/:id', name: 'intercom-detail', component: IntercomDetailPage },
    { path: '/guide', name: 'guide', component: GuidePage },
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
  ],
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
