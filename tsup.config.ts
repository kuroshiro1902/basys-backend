import { defineConfig } from 'tsup';
import packageJson from './package.json';
export default defineConfig({
  entry: ['src/index.ts'], // File đầu vào
  bundle: true, // Bundle
  minify: true, // Tối ưu kích thước file đầu ra
  sourcemap: false, // Không cần sourcemap nếu không debug
  clean: true, // Dọn sạch thư mục output
  dts: false, // Xuất file .d.ts nếu dùng TypeScript (có thể bỏ nếu không cần)
  external: [...Object.keys(packageJson.dependencies || {})],
  outDir: 'build',
});
