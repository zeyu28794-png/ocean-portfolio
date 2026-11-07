import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    // The 500 kB budget is deliberately NOT raised. Instead the 3D toolchain is
    // isolated so it is never part of the first load, and each vendor chunk is
    // kept under the budget on its own.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-three',
              test: /node_modules[\\/]three[\\/]/,
              priority: 40,
              // three's core is monolithic; 300 kB slices keep every chunk
              // inside the default warning budget and cache better.
              maxSize: 300000,
              minSize: 40000,
            },
            {
              name: 'vendor-r3f',
              test: /node_modules[\\/](@react-three|three-stdlib|troika|maath|zustand|suspend-react|its-fine|@use-gesture|@monogrid|hls\.js|react-composer|react-use-measure)[\\/]/,
              priority: 30,
              maxSize: 240000,
              minSize: 30000,
            },
            {
              name: 'vendor-gsap',
              test: /node_modules[\\/](gsap|@gsap)[\\/]/,
              priority: 20,
            },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
})
