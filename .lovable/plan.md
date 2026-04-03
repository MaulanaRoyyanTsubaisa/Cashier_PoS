

# Fix 404 di Electron + Hybrid Online/Offline

## Masalah

Electron memuat app via `file://` protocol. `BrowserRouter` menggunakan path seperti `/pos`, `/products` yang tidak ada di filesystem lokal, sehingga muncul 404.

## Solusi

### 1. Switch ke HashRouter untuk Electron

Di `src/App.tsx`, deteksi apakah app berjalan di Electron. Jika ya, gunakan `HashRouter` (URL jadi `#/pos`, `#/products`), jika browser biasa tetap `BrowserRouter`.

```tsx
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
const Router = isElectron ? HashRouter : BrowserRouter;
```

### 2. Buat ulang file Electron

File `electron/main.cjs` dan `electron/preload.cjs` sudah terhapus dari project. Perlu dibuat ulang:
- `electron/main.cjs` — load `dist/index.html`, handle IPC silent-print
- `electron/preload.cjs` — expose `window.electronAPI.silentPrint`

### 3. Update NavLink untuk HashRouter

Periksa `src/components/NavLink.tsx` dan `AppLayout.tsx` agar link navigasi kompatibel dengan kedua router.

### 4. Rebuild & repackage untuk Windows

- `vite build` dengan `base: './'`
- Package ulang dengan `@electron/packager`
- Buat ZIP untuk download

## Tentang Hybrid Mode

Aplikasi tetap **online** (login & data dari cloud) saat ada internet. Implementasi offline penuh (IndexedDB sync) adalah fitur kompleks yang bisa ditambahkan nanti secara bertahap. Langkah pertama ini fokus memperbaiki 404 agar app bisa berjalan di Electron.

