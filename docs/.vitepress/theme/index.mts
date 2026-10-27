import DefaultTheme from 'vitepress/theme'
import { onMounted, watch, nextTick, h } from 'vue'
import { useRoute } from 'vitepress'
import mediumZoom from 'medium-zoom'
import LearningAssistant from './components/LearningAssistant.vue'
import CustomToggles from './components/CustomToggles.vue'
import HarnessHome from './components/HarnessHome.vue'
import './harness.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HarnessHome', HarnessHome)
  },
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(LearningAssistant),
      'nav-bar-content-after': () => h(CustomToggles),
      'nav-screen-content-after': () => h(CustomToggles)
    })
  },
  setup() {
    const route = useRoute()
    const initZoom = () => {
      // 默认给 .vp-doc 下的所有图片添加缩放
      mediumZoom('.vp-doc img', { background: 'var(--vp-c-bg)' })
    }

    onMounted(() => {
      initZoom()
    })

    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  }
}
