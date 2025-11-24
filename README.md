# Chronicle AI - Intelligent Journaling Companion

<div align="center">

![Chronicle AI Logo](docs/logo.png)

**Your intelligent companion for self-reflection and personal growth**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Security](https://img.shields.io/badge/Security-A+-green)](REFACTORING_SUMMARY.md)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](https://chronicle-ai.app) • [Documentation](docs/) • [Report Bug](https://github.com/yourusername/chronicle-ai/issues) • [Request Feature](https://github.com/yourusername/chronicle-ai/issues)

</div>

---

## 📖 About Chronicle AI

Chronicle AI is an intelligent journaling application that combines the simplicity of traditional journaling with the power of artificial intelligence. It helps users:

- 📝 **Capture thoughts effortlessly** - Freestyle writing or guided prompts
- 🤖 **Gain AI-powered insights** - Automated analysis of emotions and patterns
- 📊 **Track emotional trends** - Visualize mood and energy over time
- 🔍 **Discover perspectives** - View entries through different lenses
- 🔒 **Maintain privacy** - End-to-end encrypted and secure

---

## ✨ Key Features

### 🎯 Core Features
- **Freestyle Journaling** - Blank canvas for free expression
- **Guided Sessions** - Structured prompts for gratitude, challenges, weekly reviews, and more
- **Voice Input** - Speak your thoughts using Web Speech API
- **Photo Attachments** - Add visual memories to entries
- **Mood & Energy Tracking** - Monitor emotional well-being

### 🤖 AI-Powered Features
- **Instant Analysis** - Automated summaries, tags, and sentiment detection
- **Socratic Questions** - Thought-provoking prompts for deeper reflection
- **Multiple Perspectives** - View entries from objective, compassionate, and future-self viewpoints
- **Long-term Insights** - Pattern recognition across multiple entries
- **Emotional Intelligence** - Understanding emotional trends and triggers

### 📅 Organization & Discovery
- **Calendar View** - Visual timeline of your journaling journey
- **On This Day** - Rediscover past entries from the same date
- **Search & Filter** - Find entries by tags, mood, or date
- **Data Export** - Download all data in JSON, Markdown, or CSV

### 🔐 Privacy & Security
- **Row-Level Security** - Database-level isolation
- **Encryption** - Data encrypted in transit and at rest
- **Private AI Processing** - Your data never trains AI models
- **GDPR Compliant** - Full data export and deletion rights

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase account
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chronicle-ai.git
cd chronicle-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

### Environment Setup

Required variables in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key  # For local dev only
VITE_APP_URL=http://localhost:5173
```

### Supabase Edge Function Configuration

Configure AI model settings via Supabase secrets (required for production):

```bash
# Set Gemini API key (required)
npx supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Set AI model (optional, defaults to gemini-2.0-flash)
npx supabase secrets set GEMINI_MODEL=gemini-2.0-flash

# Deploy edge functions
npx supabase functions deploy gemini-proxy --no-verify-jwt
```

**Available Models:**
- `gemini-2.0-flash` (default) - Fast, cost-effective
- `gemini-2.5-flash` - Latest version with enhanced capabilities
- `gemini-pro` - Most capable model for complex tasks

### Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
npx supabase db push

# Verify setup
npm run verify:db
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete production deployment instructions
- [Development Rules](AI_RULES.md) - Tech stack and coding guidelines
- [Scripts Documentation](scripts/README.md) - Available deployment scripts
- [API Documentation](docs/api.md) - API endpoints and usage
- [Contributing Guide](CONTRIBUTING.md) - How to contribute

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework with hooks and context
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **Recharts** - Data visualization

### Backend & Infrastructure
- **Supabase** - PostgreSQL database, authentication, and storage
- **Google Gemini API** - AI-powered analysis and insights
- **Supabase Edge Functions** - Serverless API layer

### Developer Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing
- **TypeScript** - Static type checking

---

## 🗂️ Project Structure

```
chronicle-ai/
├── src/
│   ├── components/          # React components
│   │   ├── Auth.tsx
│   │   ├── Header.tsx
│   │   ├── JournalEditor.tsx
│   │   ├── JournalFeed.tsx
│   │   ├── Onboarding.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── LandingPage.tsx
│   │   ├── TermsOfService.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   └── HelpCenter.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useJournal.ts
│   │   └── useSpeechRecognition.ts
│   ├── services/           # API and business logic
│   │   ├── geminiService.ts
│   │   └── dataExportService.ts
│   ├── lib/                # Third-party integrations
│   │   ├── supabase.ts
│   │   └── errorMonitoring.ts
│   ├── utils/              # Utility functions
│   │   ├── security.ts
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   └── performance.ts
│   ├── config/             # Configuration
│   │   └── index.ts
│   ├── types.ts            # TypeScript types
│   └── App.tsx             # Main app component
├── supabase/
│   ├── migrations/         # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   └── 002_security_updates.sql
│   └── functions/          # Edge functions
│       ├── gemini-proxy/
│       └── health/
├── scripts/                # Deployment scripts
│   ├── pre-deploy.sh
│   ├── validate-env.ts
│   ├── verify-database.ts
│   └── health-check.ts
├── public/                 # Static assets
├── docs/                   # Documentation
├── .env.example           # Environment template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── README.md              # This file
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🚢 Deployment

### Quick Deploy

```bash
# Run pre-deployment checks
npm run pre-deploy

# Deploy to Vercel
npm run deploy:vercel

# OR deploy to Netlify
npm run deploy:netlify
```

### Detailed Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide.

---

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Fix linting issues |
| `npm run type-check` | Check TypeScript types |
| `npm run format` | Format code with Prettier |
| `npm run pre-deploy` | Run all pre-deployment checks |
| `npm run validate:env` | Validate environment variables |
| `npm run verify:db` | Verify database setup |

---

## 🛡️ Security

Chronicle AI takes security seriously:

- **Data Encryption** - TLS in transit, encryption at rest
- **Row-Level Security** - Database-level access control
- **Input Sanitization** - XSS and injection prevention
- **Rate Limiting** - API abuse prevention
- **Security Headers** - CSP, HSTS, X-Frame-Options
- **Audit Logging** - Track all data access
- **Regular Updates** - Dependencies kept current

Report security issues to: security@chronicle-ai.app

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript strict mode
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📊 Roadmap

### Version 2.0 (Current) ✅
- [x] AI-powered insights
- [x] Guided journaling sessions
- [x] Multiple perspectives
- [x] Mood and energy tracking
- [x] Mobile-responsive design
- [x] Data export (GDPR compliance)

### Version 2.1 (Next)
- [ ] Voice journaling (full audio entries)
- [ ] Habit tracking integration
- [ ] Custom AI prompts
- [ ] Social features (shared journals)
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard

### Version 3.0 (Future)
- [ ] Multi-language support
- [ ] Therapist collaboration features
- [ ] Integration with health devices
- [ ] Community templates
- [ ] API for third-party integrations

See [ROADMAP.md](docs/ROADMAP.md) for detailed plans.

---

## 🔄 Recent Updates: Production-Ready Refactoring

### Version 2.1.0 (November 2025) - Production-Ready Release

Chronicle AI has undergone a comprehensive refactoring to achieve production-grade quality and security. All changes are **backwards compatible** with no breaking changes.

#### 🔒 Security Enhancements
- ✅ **All vulnerabilities resolved** - Updated Vite to v6.1.11, eliminating 6 moderate severity issues
- ✅ **Production-grade CSP** - Stricter Content Security Policy with separate dev/prod configurations
- ✅ **Enhanced security headers** - Added Cross-Origin policies, HSTS with preload
- ✅ **Improved input validation** - Server-side safe sanitization with fallbacks

#### 🛡️ Type Safety & Code Quality
- ✅ **Stricter TypeScript** - Enabled `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noUncheckedIndexedAccess`
- ✅ **Path aliases** - Better import organization with `@/*` aliases
- ✅ **Better type inference** - Improved type safety throughout codebase

#### ⚙️ Infrastructure Improvements
- ✅ **Vite 6 compatibility** - Latest build tool with better performance
- ✅ **Environment validation** - Runtime validation of all environment variables with Zod
- ✅ **Updated dependencies** - All packages updated to latest secure versions
- ✅ **Enhanced deployment configs** - Production-ready Vercel and Netlify configurations

#### 📊 Performance Optimizations
- ✅ **Improved tree-shaking** - Smaller bundle sizes with Vite 6
- ✅ **Better caching strategies** - Long-term caching for static assets
- ✅ **Optimized code splitting** - Maintained manual chunk splitting for optimal loading

#### 📖 Documentation
- **NEW:** `REFACTORING_SUMMARY.md` - Comprehensive refactoring documentation
- **NEW:** `src/lib/envValidation.ts` - Environment variable validation
- **NEW:** `src/config/csp.ts` - CSP configuration module

**For detailed changes, see [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md)**

**Badge Updates:**
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/Security-A+-green)](REFACTORING_SUMMARY.md)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI-powered insights
- [Supabase](https://supabase.com/) - Backend infrastructure
- [Vercel](https://vercel.com/) - Hosting platform
- [Heroicons](https://heroicons.com/) - Icon system
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- All our amazing contributors!

---

## 💬 Support

- **Documentation:** [docs.chronicle-ai.app](https://docs.chronicle-ai.app)
- **Email:** support@chronicle-ai.app
- **Discord:** [Join our community](https://discord.gg/chronicle-ai)
- **Twitter:** [@chronicle_ai](https://twitter.com/chronicle_ai)

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/chronicle-ai?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/chronicle-ai?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/chronicle-ai)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/chronicle-ai)

---

<div align="center">

**[Website](https://chronicle-ai.app)** • **[Documentation](docs/)** • **[Blog](https://blog.chronicle-ai.app)**

Made with ❤️ by the Chronicle AI team

</div>
