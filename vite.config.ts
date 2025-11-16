import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Gzip compression for production
    mode === 'production' && compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression for production
    mode === 'production' && compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer (run with ANALYZE=true npm run build)
    process.env.ANALYZE && visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Disable source maps in production for security and performance
    sourcemap: mode === 'development',
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          // UI libraries
          'ui-vendor': ['react-hot-toast', 'clsx'],
          // Charts
          'charts': ['recharts'],
          // Supabase
          'supabase': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
          // AI
          'ai-vendor': ['@google/generative-ai'],
          // i18n
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Date utilities
          'date-vendor': ['date-fns'],
          // Routing
          'router': ['react-router-dom'],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for smaller bundle
    target: 'es2015',
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed size (slower but useful)
    reportCompressedSize: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'date-fns',
    ],
  },
  // Development server
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    // Enable HTTPS in development if needed
    // https: true,
  },
  // Preview server
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
}));
