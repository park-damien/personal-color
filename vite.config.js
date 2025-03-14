import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/color-recommender/', // GitHub 저장소 이름으로 변경해주세요
}) 