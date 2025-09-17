# Chronicle AI - Tech Stack & Development Rules

## Tech Stack Overview

- **React 19** with TypeScript for type-safe component development
- **Tailwind CSS** for responsive styling and design system
- **Google Gemini API** for AI-powered journal analysis and insights
- **Recharts** for data visualization in the Insights view
- **Web Speech API** for voice-to-text functionality
- **Local Storage** for client-side data persistence
- **Marked.js** for Markdown rendering of AI-generated content
- **Lucide React** for consistent iconography throughout the app
- **Custom Hooks** for state management and cross-cutting concerns

## Library Usage Rules

### 1. State Management
- Use React's built-in `useState` and `useEffect` for component state
- Create custom hooks (`useJournal`, `useSpeechRecognition`) for shared logic
- Avoid external state management libraries unless absolutely necessary

### 2. Styling
- Use Tailwind CSS utility classes exclusively for styling
- Follow the established color palette (rose, stone, amber tones)
- Maintain consistent spacing using Tailwind's spacing scale
- Use responsive design patterns (mobile-first) with Tailwind breakpoints

### 3. AI Integration
- All AI interactions must go through the `geminiService` module
- Follow the established patterns for prompt engineering and response parsing
- Always include appropriate error handling for AI API calls
- Use the predefined schemas for structured AI responses

### 4. Data Persistence
- Use localStorage for journal entries via the `useJournal` hook
- Implement proper error handling for storage operations
- Maintain the existing data structure for journal entries

### 5. Component Architecture
- Follow the established separation between pages and components
- Keep components focused and under 100 lines when possible
- Use TypeScript interfaces for all component props
- Implement proper loading states for asynchronous operations

### 6. Accessibility
- Ensure all interactive elements have proper ARIA labels
- Maintain keyboard navigation support
- Use semantic HTML elements appropriately
- Provide alternative text for images

### 7. Performance
- Implement React.memo for expensive components when needed
- Use useCallback and useMemo appropriately to prevent unnecessary re-renders
- Lazy load heavy components if necessary

### 8. Error Handling
- Implement graceful error handling for all user-facing operations
- Provide helpful error messages when operations fail
- Use try/catch blocks for async operations with proper fallbacks

### 9. Testing
- Write unit tests for utility functions and custom hooks
- Implement integration tests for critical user flows
- Test across different screen sizes for responsiveness

### 10. File Organization
- Keep components in `/src/components/` directory
- Store hooks in `/src/hooks/` directory
- Place services in `/src/services/` directory
- Maintain type definitions in `/src/types.ts`
- Follow the established naming conventions (PascalCase for components, camelCase for utilities)

### 11. Code Formatting
- Use 2-space indentation throughout the codebase
- Follow TypeScript strict mode guidelines
- Use descriptive variable and function names
- Include JSDoc comments for complex functions
- Maintain consistent import ordering (external libraries first, then internal modules)

### 12. Third-Party Libraries
- Use Recharts exclusively for data visualization needs
- Leverage Marked.js for all Markdown rendering requirements
- Utilize Web Speech API for voice input functionality
- Avoid introducing new external libraries without team discussion