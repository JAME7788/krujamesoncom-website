import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // แยก vendor libs (leaf ที่ไม่ import โค้ดแอป จึงปลอดภัยจากปัญหา init-order)
    // ออกเป็น chunk ที่ hash คงที่ → cache ข้าม deploy ได้ ลดการโหลดซ้ำทุกหน้า
    // firebase / three / blockly ไม่แตะ เพราะ lazy-load เป็น chunk แยกอยู่แล้ว
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router') || id.includes('@remix-run')) return 'router'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'react-vendor'
          if (id.includes('framer-motion') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) return 'motion'
          if (id.includes('lucide-react')) return 'icons'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
