import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library build for the npm package. The demo app build lives in vite.config.js.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: 'index.js',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { exports: 'named' },
    },
  },
})
