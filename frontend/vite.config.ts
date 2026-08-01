import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

function normalizePath(id: string) {
  return id.split('\\').join('/');
}

function getVendorChunk(id: string) {
  const normalizedId = normalizePath(id);

  if (!normalizedId.includes('/node_modules/')) {
    return undefined;
  }

  if (
    normalizedId.includes('/antd/') ||
    normalizedId.includes('/@ant-design/icons/') ||
    normalizedId.includes('/@rc-component/') ||
    normalizedId.includes('/rc-')
  ) {
    return 'vendor-antd';
  }

  if (
    normalizedId.includes('/@ant-design/charts/') ||
    normalizedId.includes('/@antv/') ||
    normalizedId.includes('/d3-')
  ) {
    return 'vendor-charts';
  }

  if (normalizedId.includes('/@tanstack/react-query/')) {
    return 'vendor-query';
  }

  if (normalizedId.includes('/axios/')) {
    return 'vendor-http';
  }

  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      onwarn(warning, warn) {
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          warning.message.includes('"use client"') &&
          warning.id &&
          normalizePath(warning.id).includes('/node_modules/')
        ) {
          return;
        }

        warn(warning);
      },
      output: {
        manualChunks(id) {
          return getVendorChunk(id);
        },
      },
    },
  },
});
