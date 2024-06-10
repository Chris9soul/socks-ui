import { resolve } from 'path'
import { defineConfig } from 'vite'
import fs from 'fs'

let entryFiles = fs.readdirSync(resolve(__dirname, 'src/components')).map(file => {
  return resolve(__dirname, 'src/components', file)
})
entryFiles.push(resolve(__dirname, 'src/socks.ts'))


export default defineConfig({
  build: {
    lib: {
      entry: entryFiles,
      name: 'socks-ui',
      formats: ['cjs'],
      fileName: (format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: ['gsap'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          gsap: 'gsap',
        },
      },
    },
  },
})