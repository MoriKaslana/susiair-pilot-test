export default defineNuxtConfig({
  experimental: {
    appManifest: false,
  },
  compatibilityDate: '2025-05-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['@/assets/scss/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/scss/tokens" as *;',
        },
      },
    },
  },
  runtimeConfig: {
    public: {
      // overridden at runtime by NUXT_PUBLIC_API_BASE
      apiBase: 'http://localhost:3001',
    },
  },
  app: {
    head: {
      title: 'Susi Air Pilot',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
        },
      ],
    },
  },
})
