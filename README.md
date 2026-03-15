# Sui Object Explorer

An interactive visual tool for exploring Sui blockchain objects and their on-chain relationships.

Built for the Sui community. 💧

---

## What It Does

Enter any Sui Object ID and instantly see:

- **Full object metadata** — type, version, digest, owner, previous transaction
- **Interactive dependency graph** showing:
  - 🟦 The object itself (center node)
  - 🟣 Owner (wallet address or parent object)
  - 🟢 Dynamic fields (child objects)
  - 🟠 Last modifying transaction
  - ⬜ Referenced objects found in the object's fields
- **Click-through navigation** — click any node to explore that object
- **Full-screen pan + zoom** graph
- **Mainnet / Testnet / Devnet** switcher
- **Detail panel** with full fields and a link to Sui Explorer

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/sui-explorer.git
cd sui-explorer
npm install
npm run dev
```

Then open http://localhost:5173 and try `0x5` (the Sui System State object) to see it in action.

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React](https://react.dev) + [Vite](https://vitejs.dev) | App framework |
| [@mysten/sui](https://www.npmjs.com/package/@mysten/sui) | Official Sui TypeScript SDK |
| [@xyflow/react](https://reactflow.dev) | Interactive graph visualization |
| [Tailwind CSS](https://tailwindcss.com) | Styling |

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy anywhere static — Vercel, Netlify, GitHub Pages, etc.

## Contributing

PRs welcome! Some ideas for future features:

- [ ] Transaction history timeline view
- [ ] Owned objects list (for wallet addresses)
- [ ] Move module source viewer
- [ ] Object type filtering in the graph
- [ ] Shareable URLs (object ID in query params)
- [ ] Dark/light theme toggle

## License

MIT — free to use, fork, and build on.

---

*Built for the Sui community with 💙*
