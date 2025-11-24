# Contributing to Chronicle AI

First off, thank you for considering contributing to Chronicle AI! It's people like you that make Chronicle AI such a great tool.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@chronicle-ai.app.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Git
- Supabase account (for database features)
- Google Gemini API key (for AI features)

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/chronicle-ai.git
cd chronicle-ai

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/chronicle-ai.git

# 4. Install dependencies
npm install

# 5. Copy environment template
cp .env.example .env.local

# 6. Edit .env.local with your credentials
nano .env.local

# 7. Run database migrations
npx supabase db push

# 8. Start development server
npm run dev
```

### First Time Contributors

Look for issues labeled `good-first-issue` or `help-wanted`. These are great starting points!

---

## 🔄 Development Process

### 1. Create a Branch

```bash
# Update your fork with latest changes
git checkout main
git fetch upstream
git merge upstream/main

# Create a feature branch
git checkout -b feature/your-feature-name
# OR for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clear, concise commit messages
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm test

# Build to ensure no errors
npm run build
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new guided session type"
# OR
git commit -m "fix: resolve photo upload issue on Safari"
```

**Commit Message Format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat: add voice recording for journal entries

- Implement Web Speech API integration
- Add recording controls to editor
- Save audio transcription with entry

Closes #123
```

```
fix: resolve photo upload on iOS Safari

The photo upload was failing on iOS due to incorrect MIME type
handling. This fix ensures proper detection of image types.

Fixes #456
```

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Update documentation** if needed

4. **Test thoroughly** on multiple devices/browsers

### Submitting PR

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to GitHub and create Pull Request

3. Fill out the PR template completely:
   - **Description**: What does this PR do?
   - **Motivation**: Why is this change needed?
   - **Testing**: How was this tested?
   - **Screenshots**: If UI changes, include screenshots
   - **Related Issues**: Link to related issues

4. Wait for review

### PR Review Process

- Maintainers will review your PR within 3-5 days
- Address any requested changes
- Once approved, your PR will be merged!

### After PR is Merged

```bash
# Update your main branch
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define types for all props and state
- Avoid `any` type unless absolutely necessary
- Use interfaces over types when possible

**Good:**
```typescript
interface JournalEntryProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

const JournalEntryCard: FC<JournalEntryProps> = ({ entry, onDelete }) => {
  // ...
}
```

**Bad:**
```typescript
const JournalEntryCard = (props: any) => {
  // ...
}
```

### React

- Use functional components with hooks
- Keep components under 200 lines
- Extract complex logic into custom hooks
- Use meaningful component and variable names

**Good:**
```typescript
const useJournalEntry = (entryId: string) => {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  // ... hook logic
  return { entry, loading, error };
};
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Maintain consistent spacing
- Use design tokens from config

**Good:**
```tsx
<button className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">
  Save Entry
</button>
```

**Bad:**
```tsx
<button style={{ padding: '8px 16px', backgroundColor: '#f43f5e' }}>
  Save Entry
</button>
```

### File Organization

```
src/
├── components/          # Reusable UI components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── utils/              # Pure utility functions
├── types.ts            # Shared TypeScript types
└── config/             # Configuration files
```

### Naming Conventions

- **Components**: PascalCase (`JournalEditor.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`JournalEntry`)

---

## 🧪 Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Custom hooks
- Business logic

```typescript
// Example: utils/formatDate.test.ts
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });
});
```

### Integration Tests

Write integration tests for:
- Component interactions
- API calls
- User flows

```typescript
// Example: JournalEditor.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import JournalEditor from './JournalEditor';

describe('JournalEditor', () => {
  it('creates entry on submit', async () => {
    const onSubmit = jest.fn();
    render(<JournalEditor onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Write...'), {
      target: { value: 'Test entry' }
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      text: 'Test entry'
    }));
  });
});
```

### Manual Testing Checklist

Before submitting PR, test on:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Different screen sizes (mobile, tablet, desktop)

---

## 📚 Documentation

### Code Comments

- Document complex logic
- Explain "why" not "what"
- Use JSDoc for functions

```typescript
/**
 * Analyzes journal entry using AI and returns structured insights
 * @param text - The journal entry text to analyze
 * @param photo - Optional photo attachment
 * @returns Promise with AI analysis including summary, tags, and sentiment
 */
export async function analyzeEntry(
  text: string, 
  photo?: Photo
): Promise<AIAnalysis> {
  // ...
}
```

### README Updates

If your changes affect:
- Installation process
- Usage instructions
- Available scripts
- Configuration

**→ Update the README.md**

### Component Documentation

For new components, add prop documentation:

```typescript
interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  /** Click handler function */
  onClick: () => void;
  /** Visual style variant */
  variant?: 'primary' | 'secondary';
  /** Disabled state */
  disabled?: boolean;
}
```

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Test on latest version
3. Verify it's reproducible

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS, Windows]
- Browser: [e.g. chrome, safari]
- Version: [e.g. 22]

**Additional context**
Any other context about the problem.
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Mockups, examples, or other context.
```

---

## 🎨 Design Contributions

We welcome design contributions!

**Areas to contribute:**
- UI/UX improvements
- Icon designs
- Marketing materials
- Documentation graphics
- Landing page design

**How to submit:**
1. Open an issue with `design` label
2. Include mockups/prototypes
3. Explain the design rationale

---

## 🌍 Translation Contributions

Help us translate Chronicle AI!

1. Check existing translations in `src/i18n/`
2. Copy `en.json` to `[language-code].json`
3. Translate all strings
4. Test with your language selected
5. Submit PR with translation

---

## 📧 Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and support
- **Email**: maintainers@chronicle-ai.app

---

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Credited in the app (for significant contributions)

---

## ❓ Questions?

Don't hesitate to ask! We're here to help:
- Open a GitHub Discussion
- Join our Discord
- Email: hello@chronicle-ai.app

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Chronicle AI! Together, we're building something meaningful. 🙏**