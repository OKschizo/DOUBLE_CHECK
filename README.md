# DOUBLEcheck

> **Production management platform for film and media projects**

A comprehensive web application for managing film production workflows, budgets, crew, cast, locations, and schedules. Built with Next.js 15, React 18, and Firebase.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11-orange)](https://firebase.google.com/)

---

## ✨ Features

- 🎬 **Project Management** - Create and manage multiple production projects
- 💰 **Budget Tracking** - Detailed budget planning with templates and real-time analytics
- 👥 **Cast & Crew Management** - Organize talent and crew with role assignments
- 📍 **Location Scouting** - Manage filming locations with Google Maps integration
- 📅 **Scheduling** - Production scheduling with drag-and-drop timeline
- 📋 **Call Sheets** - Generate professional call sheets
- 🔧 **Equipment Tracking** - Manage production equipment inventory and checkouts
- 🎨 **Scene Breakdown** - Scene and shot planning with storyboard references
- 🔐 **Multi-tenant** - Organization-based access control
- 📱 **Responsive** - Works on desktop, tablet, and mobile

---

## 🏗️ Architecture

**Current Version:** 2.0 (Firebase Client SDK)

DOUBLEcheck uses a **modern, client-first architecture** with direct Firebase integration:

```
React Components → Custom Hooks → Firebase Client SDK → Firestore/Auth/Storage
```

**Key Technologies:**

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript
- **Styling:** Tailwind CSS 3.4
- **Database:** Firebase Firestore (real-time NoSQL)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Cloud Storage
- **State:** Zustand (lightweight global state)
- **Validation:** Zod schemas
- **Monorepo:** pnpm + Turborepo

📖 **For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)**

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **pnpm** 8 or higher
- **Firebase CLI** (optional, for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/OKschizo/DOUBLE_CHECK.git
cd DOUBLE_CHECK/doublecheck

# Install dependencies
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
pnpm dev
```

The app will be available at **http://localhost:3000**

### Environment Variables

Create a `.env.local` file in the `doublecheck/` directory:

```bash
# Firebase Client Configuration (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See [`env.example`](env.example) for the complete list.

---

## 📁 Project Structure

```
doublecheck/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── src/
│       │   ├── app/            # Next.js pages (App Router)
│       │   ├── features/       # Feature modules
│       │   ├── lib/            # Core libraries (Firebase, schemas)
│       │   ├── shared/         # Shared components
│       │   └── styles/         # Global styles
│       └── public/             # Static assets
│
├── packages/
│   ├── schemas/                # Shared Zod validation schemas
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configs (ESLint, Tailwind)
│
├── firebase.json               # Firebase configuration
├── firestore.rules             # Database security rules
├── firestore.indexes.json      # Firestore indexes
├── turbo.json                  # Turborepo configuration
└── pnpm-workspace.yaml         # Workspace definition
```

📖 **For detailed structure documentation, see [CODEBASE_MAP.md](CODEBASE_MAP.md)**

---

## 🛠️ Development

### Available Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm type-check       # TypeScript type checking
pnpm clean            # Clean build artifacts

# Firebase
pnpm deploy:firestore # Deploy Firestore rules & indexes
pnpm deploy:storage   # Deploy Storage rules
pnpm deploy:rules     # Deploy all rules
```

### Monorepo Workflow

This project uses **pnpm workspaces** + **Turborepo** for efficient monorepo management:

```bash
# Install dependencies (from root)
pnpm install

# Build all packages (Turbo handles caching)
pnpm build

# Run in specific workspace
pnpm --filter web dev
pnpm --filter @doublecheck/schemas type-check
```

### Adding New Features

1. Create feature directory: `apps/web/src/features/my-feature/`
2. Define schema: `packages/schemas/src/my-feature.ts`
3. Create hooks: `features/my-feature/hooks/useMyFeature.ts`
4. Build components: `features/my-feature/components/MyFeatureView.tsx`
5. Add Firestore indexes if needed: `firestore.indexes.json`

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed guidelines.

---

## 🚢 Deployment

### Option 1: Vercel (Recommended)

```bash
cd apps/web
vercel
```

**Pros:** Zero-config, automatic previews, edge network  
**Ideal for:** Fast iteration, preview environments

### Option 2: Firebase Hosting

```bash
pnpm build
firebase deploy
```

**Pros:** Tight Firebase integration  
**Ideal for:** All-in-one Firebase solution

### Option 3: Google Cloud Run

```bash
# Build Docker image
docker build -t doublecheck .

# Deploy
gcloud run deploy doublecheck \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Pros:** Full control, scalability  
**Ideal for:** Enterprise deployments

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed deployment guides.

---

## 🔥 Firebase Setup

### Your Firebase Project

- **Project ID:** `doublecheck-9f8c1`
- **Console:** [https://console.firebase.google.com/project/doublecheck-9f8c1](https://console.firebase.google.com/project/doublecheck-9f8c1)

### Services Used

| Service | Purpose |
|---------|---------|
| **Firestore** | Real-time NoSQL database for all app data |
| **Authentication** | User authentication (Email, Google OAuth) |
| **Storage** | File and image storage for project assets |
| **Hosting** | Static site hosting (optional) |
| **Cloud Run** | Containerized app hosting (optional) |

### Deploy Security Rules

After making changes to `firestore.rules` or `storage.rules`:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

---

## 📊 Feature Modules

### Core Features

| Feature | Description | Collections |
|---------|-------------|-------------|
| **Projects** | Project management | `projects`, `projectMembers` |
| **Budget** | Financial planning | `budgetCategories`, `expenses` |
| **Crew** | Crew management | `crew`, `crewTemplates` |
| **Cast** | Talent management | `cast`, `castTemplates` |
| **Equipment** | Inventory tracking | `equipment`, `checkoutHistory` |
| **Locations** | Location scouting | `locations` |
| **Scenes** | Scene breakdown | `scenes`, `shots` |
| **Schedule** | Production scheduling | `shootingDays`, `scheduleEvents` |

### Templates

Pre-built templates for different production types:
- 🎬 Feature Films
- 📺 Episodic/TV
- 📽️ Commercials
- 🎥 Documentaries
- 🎵 Music Videos
- 📸 Photoshoots

---

## 🔐 Security

### Authentication

- Email/password authentication via Firebase Auth
- Google OAuth integration
- Session management with Firestore user documents

### Authorization

- Organization-level access control (`orgId`)
- Role-based permissions (admin, member, viewer)
- Firestore Security Rules enforcement

⚠️ **Note:** Current rules are permissive for development. Tighten for production:

```javascript
// Recommended: Organization-level access
match /projects/{projectId} {
  allow read: if isOrgMember(resource.data.orgId);
  allow write: if isOrgMember(request.resource.data.orgId);
}
```

---

## 🧪 Testing

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format
```

---

## 📈 Performance

- **Bundle Size:** ~450KB (gzipped)
- **First Load:** < 2s on 3G
- **Real-time Updates:** < 100ms latency
- **Firestore Queries:** Indexed for optimal performance

**Optimization Features:**
- Code splitting by route
- Image optimization with Next.js Image
- Tree-shaking unused dependencies
- Real-time subscriptions with automatic cleanup

---

## 🤝 Contributing

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

### Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

---

## 📚 Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete architecture documentation
- **[CODEBASE_MAP.md](CODEBASE_MAP.md)** - Code structure and patterns
- **[API_ROUTES.md](API_ROUTES.md)** - API routes reference
- **[docs/](docs/)** - Firebase setup and deployment guides

---

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" in Firestore**
- Check `firestore.rules`
- Ensure user is authenticated
- Verify `orgId` matches

**Build errors**
- Run `pnpm install` from workspace root
- Check TypeScript errors: `pnpm type-check`
- Clear cache: `pnpm clean && pnpm install`

**Real-time updates not working**
- Check browser console for Firestore errors
- Deploy indexes: `firebase deploy --only firestore:indexes`
- Verify query structure matches indexes

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/OKschizo/DOUBLE_CHECK/issues)
- **Discussions:** [GitHub Discussions](https://github.com/OKschizo/DOUBLE_CHECK/discussions)

---

## 📄 License

**Private - All Rights Reserved**

This is a proprietary application. Unauthorized copying, modification, or distribution is prohibited.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Zod](https://zod.dev/) - Schema validation
- [Turborepo](https://turbo.build/repo) - Monorepo tooling

---

**Made with ❤️ for production teams**
