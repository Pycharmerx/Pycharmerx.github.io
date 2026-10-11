# Eduard — Fullstack Engineering & Applied AI

Bilingual portfolio with 14 detailed project presentations spanning web, iOS, backend, AI agents, machine learning and enterprise integrations.

**Website:** https://pycharmerx.github.io/

- [English](https://pycharmerx.github.io/?lang=en)
- [Русский](https://pycharmerx.github.io/?lang=ru)

Interface illustrations are presentation concepts with sample data. Case narratives describe the implementation scope; they do not imply public releases or measured client results.

## Development

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
npm run test:sites
npm run preview
```

The static website is built into `dist/client`. GitHub Actions builds, checks and deploys the site to GitHub Pages on pushes to `main`.

Built with React and Vite. English/Russian content lives in `src/content.json`. Navigation supports direct case links, browser history, keyboard controls and reduced-motion preferences. The opening section links to three representative cases; the full catalogue remains filterable in gallery and list views.

Contact: kheladzedev@gmail.com
