<div align="center">

# ⚡ Syncron

**An ultra-fast, local-first Markdown workspace engineered for zero-latency editing and conflict-free cloud synchronization.**

[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Dexie.js-IndexedDB-2C3E50?style=flat-square&logo=indexeddb&logoColor=white)](https://dexie.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Live Demo](#) • [Architecture](#architecture) • [Getting Started](#-local-setup) • [Contributing](#)

</div>

---

## 💡 The "Why": The Architecture Hook

Traditional web applications rely on standard request-response CRUD cycles, forcing user interactions to block on network roundtrips and introducing typing latency, spinners, and complete failure when disconnected.

**Syncron flips this paradigm on its head.**

By adopting a **Local-First Architecture**, all writes and reads execute against an in-browser embedded database (**IndexedDB via Dexie.js**) with zero network overhead. Changes are committed instantly with an **Optimistic UI**, while background replication bridges the gap between raw local speed and reliable multi-device cloud persistence.

---

## ✨ Core Features

- ⚡ **Zero-Latency Local Saves (Optimistic UI)**: Every keystroke, title modification, and tag mutation commits instantaneously to IndexedDB without UI blocking.
- 📴 **Offline-First Creation & Editing**: Create, update, and organize notes completely disconnected from the Internet; your data never leaves your browser until you choose to sync.
- 🔄 **Bi-Directional Sync & Conflict Resolution (Upcoming)**: State-based replication powered by CRDTs (Conflict-Free Replicated Data Types) and Last-Write-Wins (LWW) heuristics to converge divergent offline states seamlessly.
- 🧪 **"Chaos Engineering" Developer Controls**: Built-in developer controls with a top-bar **Network Kill Switch** to simulate flaky connections, dropped packets, and offline queuing in real-time.
- 🧱 **Soft Deletes (Tombstoning Architecture)**: Deletions write immutable `deletedAt` timestamps and `pending_delete` states instead of naive destructive drops, guaranteeing reliable distributed sync convergence.
- 🎨 **Distraction-Free Notion-Style Workspace**: Clean visual hierarchy featuring high whitespace, subtle multi-tier shadows, live Markdown split preview, and keyboard shortcuts (`Ctrl+N`, `Ctrl+B`, `Ctrl+I`).

---

## 🏗️ Architecture

Syncron separates local reads/writes from asynchronous transport synchronization using a tombstone-aware data store.

![Syncron Architecture](./docs/architecture.png)

```
[ User Interaction ]
        │
        ▼ (0ms latency)
[ React State / Optimistic UI ]
        │
        ▼
[ Dexie.js (IndexedDB) ] ── (id: UUID v4, deletedAt: null | timestamp, syncStatus: pending_push)
        │
        ▼ (Background Replication Bus)
[ Conflict Resolution / CRDT Engine ]
        │
        ▼
[ Remote Storage / Cloud Mesh ]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | High-performance modular component rendering & instant HMR |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict type safety, shared domain models, and refactoring security |
| **Local Store** | [Dexie.js](https://dexie.org/) | Reactive IndexedDB wrapper with `useLiveQuery` hooks |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Curated Notion-inspired minimalist design tokens & glassmorphism |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, consistent developer interface icons |
| **Identity** | [UUID v4](https://github.com/uuidjs/uuid) | Conflict-free client-side primary key generation |

---

## 🚀 Local Setup

Get Syncron running locally in under 60 seconds:

### 1. Clone the repository
```bash
git clone https://github.com/swayam-248/Syncron.git
cd Syncron
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

Visit [`http://localhost:5173`](http://localhost:5173) in your browser to start writing notes.

---

## 🗺️ Roadmap

- [x] **Day 1**: Notion-style UI Shell, Top Navigation & Chaos Dev Controls
- [x] **Day 2**: Client-side Dexie.js (IndexedDB) Schema, UUID generation & Reactive Live Queries
- [ ] **Day 3**: Background Replication Bus & WebSocket Sync Protocol
- [ ] **Day 4**: CRDT Conflict-Free Text Merging & End-to-End Encryption

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
