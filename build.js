const { build } = require('esbuild');
const fs = require('fs');
const path = require('path');

// Hàm copy thư mục bằng fs
function copyFolderSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Build với esbuild
build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'build/index.js',
  minify: true,
  sourcemap: false,
})
  .then(() => {
    copyFolderSync('src/data', 'build/src/data'); // Copy thư mục
    // fs.copyFileSync('.env', 'build/.env'); // copy env
    console.log('✅ Build thành công và đã copy thư mục data!');
  })
  .catch((err) => {
    console.log('❌ Build error:', err?.message);
    process.exit(1);
  });
