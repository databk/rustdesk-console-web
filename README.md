# RustDesk Console Web

Web frontend for [RustDesk Console](https://github.com/databk/rustdesk-console), built with [Ant Design Pro](https://pro.ant.design) and [UmiJS](https://umijs.org).

## Features

- Device management
- User and address book management
- Group and permission management
- Activity monitoring and statistics
- Multi-language support

## Prerequisites

- Node.js >= 20.0.0

## Getting Started

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Available Scripts

| Script            | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start dev server (connects to dev API) |
| `npm start`       | Start dev server with mock data        |
| `npm run build`   | Build for production                   |
| `npm run preview` | Build and preview locally              |
| `npm run lint`    | Run linter (Biome + TypeScript)        |
| `npm test`        | Run tests                              |

## License

[AGPL-3.0](LICENSE)
