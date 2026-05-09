import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
/** 어떤 경로로 들어와도 메인 배너 Firestore 동기화(onSnapshot)가 즉시 시작되도록 */
import './stores/contentStore.js'

createApp(App).use(router).mount('#app')
