import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'tests/.compiled',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: 'tests/mockDatabase.spec.js',
      output: {
        format: 'iife',
        entryFileNames: 'tests.js',
      },
    },
  },
})
