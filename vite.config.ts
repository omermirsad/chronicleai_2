import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
    // PWA Configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Chronicle AI',
        short_name: 'ChronicleAI',
        description: 'Your intelligent journaling companion with AI-powered insights.',
        theme_color: '#fef2f2',
        background_color: '#fef2f2',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['productivity', 'health', 'lifestyle'],
        screenshots: []
      },
      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false, // Disable PWA in development
      }
    }),
  ];

  // Add production-only plugins
  if (mode === 'production') {
    plugins.push(
      compression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
      })
    );
  }

  // Add bundle analyzer if ANALYZE env var is set
  if (process.env.ANALYZE) {
    plugins.push(
      visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }) as PluginOption
    );
  }

  return {
    plugins,
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
  };
});
