# Cider4Me

AI assistance on the page you're already reading — for Firefox and Chrome.

Select text on any page to explain, translate, or ask about it, and keep the conversation going in a resizable sidebar that understands what you're reading. Bring your own API key: no account, no subscription, no tracking.

## Features

- **Act on any selection** — Explain, Translate, Ask AI, Add to Context, Copy, and URL actions, with fully customizable prompts.
- **Chat with the page** — a sidebar with automatic page context, conversation history, and inline chat where you select.
- **Your keys, your models** — OpenRouter, Google Gemini, Cortecs, or any OpenAI-compatible endpoint with your own API key.

## Install

### Firefox (temporary load for now)

1. Build the extension (see below), or grab a zip from [Releases](https://github.com/Darkshadenl/Cider4Me/releases).
2. Open `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → pick any file inside the unpacked extension.

### Chrome

1. Build the extension, then open `chrome://extensions`.
2. Enable **Developer mode** → **Load unpacked** → select the built `chrome` folder.

## Build

Requires [Bun](https://bun.sh).

```bash
bun install
bun run build        # builds both targets into dist/chrome and dist/firefox
```

## Development

```bash
bun run check        # lint + typecheck + tests + build
bun test             # tests only
bun run dev          # watch mode for the options page
```

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) — use it, study it, fork it freely for noncommercial purposes. Commercial use requires permission from the author.
