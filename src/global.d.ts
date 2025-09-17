/// <reference types="react" />
/// <reference types="react-dom" />

declare module 'react-hot-toast';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
