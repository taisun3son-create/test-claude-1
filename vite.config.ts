import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// singlefile: ビルド結果を1つのHTMLにまとめ、file:// で直接開けるようにする
export default defineConfig({
  plugins: [react(), viteSingleFile()],
})
