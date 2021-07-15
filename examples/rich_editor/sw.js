self.addEventListener('fetch', (e) => {
  console.log(`[Serive Worker] Fetch event resource: ${e.request.url}`);
});
