import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` writes one self-contained dist/index.html (code, styles and sprites inlined),
// so the built game still opens straight from disk, like the original single-file prototype.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
});
