# My AI Assets

A digital garden for managing and sharing AI-related content.

## Features

- 🌐 Multi-language support (Chinese, English, Japanese, French, Spanish, Portuguese, German, Italian)
- 📝 Article publishing with AI auto-review
- 🗂️ Folder and tag organization
- 📊 Statistics dashboard
- 🗑️ Recycle bin for deleted articles
- 🔐 Admin management panel

## Tech Stack

- Astro 4.x
- React 18
- TypeScript
- Cloudflare Pages

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Deployment

This project is configured to deploy to Cloudflare Pages.

### GitHub Actions (Auto-deploy)

Push to the `main` branch to trigger automatic deployment.

### Manual Deployment

```bash
# Install wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run deploy
```

## License

MIT
