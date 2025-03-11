import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  bundle: true, // ✅ Gom toàn bộ dependency vào file build
  minify: true,
  clean: true,
});
