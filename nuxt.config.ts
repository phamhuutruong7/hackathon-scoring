// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  supabase: {
    // URL + anon key are read from SUPABASE_URL / SUPABASE_KEY env vars
    types: '~/types/database.types.ts',
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/login', '/confirm'],
    },
  },

  app: {
    head: {
      title: 'FHN Hackathon Scoring',
      htmlAttrs: { lang: 'vi' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
})
