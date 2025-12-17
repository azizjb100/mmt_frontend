import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// =======================
// VUETIFY
// =======================
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// =======================
// STYLES
// =======================
import './styles/global.css'
import './styles/desktop-app.css'
import './styles/desktop-theme.css'
import '@mdi/font/css/materialdesignicons.css'

// =======================
// TOAST
// =======================
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// =======================
// INIT VUETIFY
// =======================
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
  },
})

// =======================
// CREATE APP
// =======================
const app = createApp(App)

// =======================
// PINIA
// =======================
const pinia = createPinia()
app.use(pinia)

// =======================
// ROUTER
// =======================
app.use(router)

// =======================
// VUETIFY
// =======================
app.use(vuetify)

// =======================
// TOAST
// =======================
app.use(Toast, {
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
  position: "top-right",
  timeout: 4000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
})

// =======================
// MOUNT
// =======================
app.mount('#app')
