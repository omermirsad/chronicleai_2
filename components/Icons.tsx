// Fix: Import React and FC type
import React, { FC } from 'react';

type IconProps = {
  className?: string;
};

// Fix: Use FC type for functional component
export const BookOpenIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

// Fix: Use FC type for functional component
export const PencilSquareIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

// Fix: Use FC type for functional component
export const SparklesIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const MicrophoneIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

// Fix: Use FC type for functional component
export const StopCircleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.563A.562.562 0 0 1 9 14.437V9.564Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const PhotoIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const PaperAirplaneIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
);

// Fix: Use FC type for functional component
export const TagIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const ChatBubbleLeftRightIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.72-3.72a1.05 1.05 0 0 0-1.485 0L12 15.338V12.5a2.25 2.25 0 0 1 2.25-2.25h3.812M15.375 12.25l-3.72-3.72a1.05 1.05 0 0 0-1.485 0L8.625 10.125M15.375 12.25l2.25-2.25M8.625 10.125a2.25 2.25 0 0 1 2.25-2.25h3.812M8.625 10.125a2.25 2.25 0 0 0-2.25 2.25v4.286c0 1.135.847 2.1 1.98 2.193l3.72-3.72a1.05 1.05 0 0 0 0-1.485L8.625 10.125Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const LightBulbIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

// Fix: Use FC type for functional component
export const XMarkIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

// Fix: Use FC type for functional component
export const SeedingIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10a6 6 0 0 0-6-6H3v2a6 6 0 0 0 6 6h3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14a6 6 0 0 1 6-6h3v1a6 6 0 0 1-6 6h-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v-10" />
    </svg>
);

// Fix: Use FC type for functional component
export const LightningBoltIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const CalendarDaysIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18" />
    </svg>
);

// Fix: Use FC type for functional component
export const ArrowUturnLeftIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

// Fix: Use FC type for functional component
export const HeartIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const MountainIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12.095 5.25-5.25a2.25 2.25 0 0 1 3.182 0l3.182 3.182a2.25 2.25 0 0 0 3.182 0l5.25-5.25 1.5 1.5-5.25 5.25a2.25 2.25 0 0 1-3.182 0l-3.182-3.182a2.25 2.25 0 0 0-3.182 0-2.25 2.25 0 0 0-3.182 0l-5.25 5.25 1.5 1.5Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const CompassIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664l.143.258a1.107 1.107 0 0 0 1.664.57l.143-.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.126 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568c0 .334-.148.65-.405.864l-1.068.892c-.442.369-.535 1.01-.216 1.49l.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664l.143.258a1.107 1.107 0 0 0 1.664.57l.143-.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.126 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568a1.125 1.125 0 0 0-.864.405l-.89.107a1.125 1.125 0 0 0-1.49.216l-.766.51a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664l.143.258a1.107 1.107 0 0 0 1.664.57l.143-.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.126 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568a1.125 1.125 0 0 0-.864.405l-.89.107a1.125 1.125 0 0 0-1.49.216l-.766.51a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664l.143.258a1.107 1.107 0 0 0 1.664.57l.143-.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.126 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664l.143.258a1.107 1.107 0 0 0 1.664.57l.143-.048a2.25 2.25 0 0 1 1.161.886l.51.766c.319.48.126 1.121-.216 1.49l-1.068.89a1.125 1.125 0 0 0-.405.864v.568" />
    </svg>
);

// Fix: Use FC type for functional component
export const UserCircleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const EyeIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const ScaleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c-.317.047-.63.091-.94.132m-11.62 0c-.317.047-.63.091-.94.132m0 0a48.417 48.417 0 0 1 13.5 0M5.25 7.5h13.5m-13.5 0a.75.75 0 0 1-.75-.75V6.75a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H5.25Z" />
    </svg>
);

// Fix: Use FC type for functional component
export const GithubIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
);

// Fix: Use FC type for functional component
export const GoogleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// Fix: Use FC type for functional component
export const AppleIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.228 9.773c.915-.99 1.531-2.336 1.531-3.727 0-.015-.015-.03-.015-.045 0-.165.015-.315.015-.465-.06-.855-.42-1.665-.96-2.325-.9-.975-2.19-1.575-3.525-1.575-1.725 0-3.36.855-4.29 2.16-.93-1.305-2.58-2.16-4.365-2.16-2.25 0-4.215 1.395-5.22 3.525-.99 2.1-1.02 5.685.27 8.16 1.02 1.95 2.61 3.765 4.545 4.695 1.23.6 2.505.915 3.735.915.225 0 .465-.015.69-.03 1.38-.135 2.76-.705 3.84-1.65.045-.045.09-.075.135-.12.42-.42.945-1.125.945-1.125s.015-.015.015-.03c-.015-.03 0-.06-.015-.09-.015-.03-.03-.06-.045-.075s-.03-.045-.06-.06c-.015 0-.03-.015-.045-.03-.18-.18-.36-.36-.57-.555-.075-.075-.15-.15-.225-.225l-.045-.045c-1.14-1.035-2.475-1.62-3.915-1.62-.315 0-.615.03-.915.09-.3.045-.6.105-.9.18-.3.075-.585.15-.87.255-.285.105-.555.225-.825.345-.27.12-.525.255-.78.405-.255.15-.51.315-.75.495-.12.09-.24.18-.345.285-.12.105-.225.225-.33.345-.105.12-.195.24-.285.375-.09.135-.18.27-.255.405-.075.15-.135.3-.195.465-.06.165-.12.33-.165.51-.045.18-.075.36-.105.555-.03.195-.045.39-.06.6-.015.21-.015.42-.015.63 0 1.59 1.05 2.955 2.58 3.51.525.195 1.065.3 1.62.3.69 0 1.38-.15 2.01-.435.585-.255 1.125-.615 1.605-1.065.195-.18.375-.375.54-.57.165-.195.315-.405.465-.63.15-.225.285-.45.405-.69.12-.24.225-.495.315-.75.09-.27.165-.54.225-.825.06-.285.105-.57.135-.87.03-.3.045-.6.045-.9 0-.255-.015-.51-.045-.75-.03-.24-.075-.48-.12-.705-.045-.24-.105-.465-.165-.69-.06-.225-.135-.45-.21-.66-.075-.225-.15-.435-.24-.645-.09-.21-.18-.405-.285-.6-.105-.195-.21-.375-.33-.555-.12-.18-.24-.345-.375-.51-.135-.165-.27-.33-.42-.48-.15-.15-.3-.3-.465-.45-.165-.15-.33-.285-.51-.42-.18-.135-.36-.255-.555-.375-.195-.12-.405-.225-.615-.33-.21-.105-.435-.195-.66-.285-.225-.09-.45-.165-.69-.24-.24-.075-.48-.135-.735-.195-.255-.06-.51-.105-.78-.15-.27-.045-.54-.075-.825-.105-.285-.03-.57-.045-.87-.045-.15 0-.3-.015-.45-.015l-.105.015c-.15.015-.3.03-.45.045-.15.015-.285.045-.435.06-.15.03-.3.06-.45.09-.15.03-.285.075-.435.105-.15.045-.3.09-.435.135-.15.06-.285.12-.42.18-.135.06-.27.135-.39.21-.135.075-.255.165-.375.255-.12.09-.24.18-.345.285-.12.09-.225.21-.33.315-.105.105-.21.225-.3.345-.09.12-.18.24-.255.375-.075.135-.15.27-.21.42-.06.15-.12.3-.165.465-.045.165-.09.33-.12.51-.03.18-.06.36-.075.555-.015.195-.03.39-.03.6s0 .42.015.63.03.42.045.615c.015.195.045.375.075.555.03.18.075.36.12.525.045.165.105.33.165.495.06.165.135.33.21.48.075.165.165.315.255.465.09.15.195.3.3.45.09.15.21.285.315.42.12.135.24.27.375.39.135.12.27.24.42.345.15.105.3.195.465.285.165.09.33.18.51.255.18.075.36.15.555.21.195.06.39.12.6.165.21.045.42.09.63.12.21.03.435.045.645.06.225.015.45.015.675.015.825 0 1.635-.21 2.37-.615.795-.42 1.47-1.095 1.89-1.935.42-.84.555-1.8.42-2.715-.09-.645-.36-1.26-.765-1.8z"/>
  </svg>
);

// Fix: Use FC type for functional component
export const ChartBarIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

// Fix: Add missing TrashIcon component
export const TrashIcon: FC<IconProps> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);
