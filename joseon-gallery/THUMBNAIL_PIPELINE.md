# Thumbnail pipeline

The gallery never scrapes museum pages at runtime.

- `works.json`: work metadata and original collection page URL.
- `thumbnails.json`: pre-collected, verified external image URLs keyed by work ID.
- `thumbnail-queue.json`: unresolved work IDs only.
- `scripts/thumbnail-resolver.cjs`: institution-aware resolver extracted from the legacy proxy logic.
- `scripts/collect-thumbnails.cjs`: batch collector/verifier.
- `.github/workflows/joseon-thumbnail-collector.yml`: manual-only runner. There is no schedule.

The legacy `thumb-proxy.js` can remain deployed as an emergency diagnostic tool, but `index.html` does not call it.

## Manual run

```bash
node joseon-gallery/scripts/collect-thumbnails.cjs
node joseon-gallery/scripts/collect-thumbnails.cjs --limit 25
node joseon-gallery/scripts/collect-thumbnails.cjs --source "The Met"
node joseon-gallery/tests/thumbnail-architecture.test.cjs
```

Only URLs that return an actual image response are written to `thumbnails.json`. Image files are never copied into this repository.
