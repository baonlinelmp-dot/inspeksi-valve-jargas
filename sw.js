const CACHE='inspeksi-valve-v32-7';
const CORE=['./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);

  // Jangan pernah sentuh request lintas domain (termasuk Google Apps Script).
  if(url.origin!==self.location.origin) return;

  // POST/selain GET tidak boleh dicache/intercept.
  if(req.method!=='GET') return;

  // Halaman utama selalu network-first agar update GitHub langsung terbaca.
  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  // Asset PWA: network-first, cache fallback.
  event.respondWith(
    fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
      return res;
    }).catch(()=>caches.match(req))
  );
});
