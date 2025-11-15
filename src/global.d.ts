/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react-hot-toast';

// Import the English translation file as a type
import 'react-i18next';
import enTranslation from '../public/locales/en/translation.json';

declare module 'react-i18next' {
  // Extend the default namespace
  interface CustomTypeOptions {
    // Use the type of the English translation file
    defaultNS: 'translation';
    resources: {
      translation: typeof enTranslation;
    };
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

interface WindowEventMap {
  'navigate': CustomEvent<string>;
}

interface Window {
  marked: {
    parse: (markdown: string) => string;
  };
}
