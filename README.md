# ZKRAT Kolektiv

Portfolio website for Zkrat Kolektiv — a collective of multidisciplinary artists based in Brno (CZE).

Built with Next.js, React Three Fiber, and Sanity CMS.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## TODO

- [ ] Fix CORS issue with Sanity CDN images — currently cover images are fetched server-side and converted to base64 data URLs as a workaround. Ideally, images should load directly from `cdn.sanity.io` on the client via `THREE.TextureLoader` to reduce page payload and improve performance.
