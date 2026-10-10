import { defineConfig } from 'tsup'

// bundle:false => each source file is transpiled individually, so dist/ mirrors src/.
export default defineConfig({
  entry: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.*', '!src/**/*.spec.*', '!src/**/*.stories.*'],
  format: ['esm'],
  bundle: false,
  dts: false,        // types stripped at runtime; staging prioritises runtime resolution
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: false,
  outDir: 'dist',
  esbuildOptions(options) {
    options.loader = { ...options.loader, '.less': 'empty' }
    // Automatic JSX runtime: emit react/jsx-runtime imports instead of bare
    // React.createElement — sources that use JSX without importing React still work.
    options.jsx = 'automatic'
    options.jsxImportSource = 'react'
  },
})
