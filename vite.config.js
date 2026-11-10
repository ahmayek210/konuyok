import { defineConfig } from 'vite';

// Her üretim derlemesi soru dosyasını benzersiz bir URL ile ister.
// Böylece eski JSON önbelleği, yeni uygulamayla karışmaz.
export default defineConfig({
  base: './',
  define: {
    __QUESTIONS_BUILD_VERSION__: JSON.stringify(process.env.GITHUB_SHA ?? Date.now().toString(36))
  }
});
