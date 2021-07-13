// 注意: 中身は空でいいので、最低限、fetchは用意しておく。
self.addEventListener('fetch', (e) => {
  console.log(`[Serive Worker] Fetch event resource: ${e.request.url}`);
});
