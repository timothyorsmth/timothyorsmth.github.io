/* Vite configuration for the development server and production build; the React plugin enables React support and Fast Refresh. */
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
})
