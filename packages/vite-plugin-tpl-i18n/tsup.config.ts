import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
  outDir: 'dist',
  format: ['esm', 'cjs'],
  clean: true,
  sourcemap: true,
  entry: [
    path.resolve(__dirname, 'lib/index.ts')
  ],
  dts: true,
  external: ['vite']
})