
> chronicle-ai@2.0.0 type-check
> tsc --noEmit

src/components/CalendarView.tsx(23,20): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/CalendarView.tsx(24,17): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/CalendarView.tsx(26,15): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/CalendarView.tsx(47,42): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/CalendarView.tsx(68,44): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/CalendarView.tsx(109,73): error TS2532: Object is possibly 'undefined'.
src/components/Footer.tsx(2,8): error TS6133: 'React' is declared but its value is never read.
src/components/InsightsView.tsx(25,27): error TS2532: Object is possibly 'undefined'.
src/components/JournalEditor.tsx(202,20): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/components/JournalEditor.tsx(297,72): error TS2304: Cannot find name 'cloneElement'.
src/components/JournalEditor.tsx(329,112): error TS2322: Type 'string | Promise<string>' is not assignable to type 'string | TrustedHTML'.
  Type 'Promise<string>' is not assignable to type 'string | TrustedHTML'.
src/components/JournalEditor.tsx(352,114): error TS2322: Type 'string | Promise<string>' is not assignable to type 'string | TrustedHTML'.
  Type 'Promise<string>' is not assignable to type 'string | TrustedHTML'.
src/components/JournalEditor/index.tsx(22,66): error TS6133: 'updateEntry' is declared but its value is never read.
src/components/JournalEntryCard.tsx(35,13): error TS7030: Not all code paths return a value.
src/components/Onboarding.tsx(77,43): error TS2532: Object is possibly 'undefined'.
src/components/Onboarding.tsx(81,43): error TS2532: Object is possibly 'undefined'.
src/components/Onboarding.tsx(85,43): error TS2532: Object is possibly 'undefined'.
src/components/Onboarding.tsx(111,43): error TS2532: Object is possibly 'undefined'.
src/components/VoiceRecordingTimer.tsx(15,3): error TS2339: Property '_tier' does not exist on type 'VoiceRecordingTimerProps'.
src/components/VoiceRecordingTimer.tsx(15,3): error TS6133: '_tier' is declared but its value is never read.
src/hooks/useGamification.ts(53,14): error TS2344: Type 'RawAchievementData[]' does not satisfy the constraint 'string'.
src/hooks/useGamification.ts(58,72): error TS2339: Property 'map' does not exist on type 'GetRpcFunctionFilterBuilderByArgs<never, FnName, Args>["Result"]'.
src/hooks/useGamification.ts(95,53): error TS2339: Property 'current_streak' does not exist on type 'never'.
src/hooks/useGamification.ts(100,33): error TS2339: Property 'current_streak' does not exist on type 'never'.
src/hooks/useGamification.ts(101,33): error TS2339: Property 'longest_streak' does not exist on type 'never'.
src/hooks/useGamification.ts(107,34): error TS2339: Property 'current_streak' does not exist on type 'never'.
src/hooks/useGamification.ts(127,50): error TS2344: Type 'string[]' does not satisfy the constraint 'string'.
src/hooks/useGamification.ts(137,32): error TS2352: Conversion of type 'string | undefined' to type 'AchievementDefinition[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'string' is not comparable to type 'AchievementDefinition[]'.
src/hooks/useLanguageSync.ts(27,32): error TS2339: Property 'preferences' does not exist on type 'never'.
src/hooks/useLanguageSync.ts(66,44): error TS2339: Property 'preferences' does not exist on type 'never'.
src/hooks/useLanguageSync.ts(70,19): error TS2345: Argument of type '{ preferences: { language: AppLanguage; emailNotifications: boolean; insightsFrequency: "daily" | "weekly" | "monthly" | "never"; weeklyDigest: boolean; onThisDay: boolean; streakReminders: boolean; achievementNotifications: boolean; }; }' is not assignable to parameter of type 'never'.
src/hooks/useOfflineSync.ts(96,48): error TS2345: Argument of type 'OfflineAction' is not assignable to parameter of type 'Error | undefined'.
  Type 'AddAction' is missing the following properties from type 'Error': name, message
src/hooks/useSpeechRecognition.ts(92,52): error TS2344: Type '{ recordings_used: number; recordings_limit: number; recordings_remaining: number; }' does not satisfy the constraint 'string'.
src/hooks/useSpeechRecognition.ts(130,24): error TS7053: Element implicitly has an 'any' type because expression of type '0' can't be used to index type 'SpeechRecognitionAlternative'.
  Property '0' does not exist on type 'SpeechRecognitionAlternative'.
src/hooks/useSpeechRecognition.ts(155,18): error TS2339: Property 'warningAtSeconds' does not exist on type '{ readonly enabled: false; readonly maxDurationSeconds: 0; readonly monthlyRecordingLimit: 0; readonly displayName: "Not available"; } | { readonly enabled: true; readonly maxDurationSeconds: 60; readonly monthlyRecordingLimit: 40; readonly warningAtSeconds: 50; readonly displayName: "1 min per recording, 40/month";...'.
  Property 'warningAtSeconds' does not exist on type '{ readonly enabled: false; readonly maxDurationSeconds: 0; readonly monthlyRecordingLimit: 0; readonly displayName: "Not available"; }'.
src/hooks/useSpeechRecognition.ts(156,29): error TS2339: Property 'warningAtSeconds' does not exist on type '{ readonly enabled: false; readonly maxDurationSeconds: 0; readonly monthlyRecordingLimit: 0; readonly displayName: "Not available"; } | { readonly enabled: true; readonly maxDurationSeconds: 60; readonly monthlyRecordingLimit: 40; readonly warningAtSeconds: 50; readonly displayName: "1 min per recording, 40/month";...'.
  Property 'warningAtSeconds' does not exist on type '{ readonly enabled: false; readonly maxDurationSeconds: 0; readonly monthlyRecordingLimit: 0; readonly displayName: "Not available"; }'.
src/hooks/useSpeechRecognition.ts(160,17): error TS2339: Property 'warning' does not exist on type '{ (message: Message, opts?: Partial<Pick<Toast, "className" | "id" | "icon" | "style" | "duration" | "ariaProps" | "position" | "iconTheme" | "toasterId" | "removeDelay">> | undefined): string; ... 8 more ...; promise<T>(promise: Promise<...> | (() => Promise<...>), msgs: { ...; }, opts?: DefaultToastOptions | undef...'.
src/hooks/useSpeechRecognition.ts(206,50): error TS2344: Type '{ success: boolean; error?: string | undefined; recordings_used: number; recordings_limit: number; recordings_remaining: number; }' does not satisfy the constraint 'string'.
src/hooks/useSpeechRecognition.ts(226,15): error TS2339: Property 'info' does not exist on type '{ (message: Message, opts?: Partial<Pick<Toast, "className" | "id" | "icon" | "style" | "duration" | "ariaProps" | "position" | "iconTheme" | "toasterId" | "removeDelay">> | undefined): string; ... 8 more ...; promise<T>(promise: Promise<...> | (() => Promise<...>), msgs: { ...; }, opts?: DefaultToastOptions | undef...'.
src/hooks/useSubscription.ts(86,14): error TS2344: Type '{ success: boolean; calls_used: number; calls_remaining: number; calls_limit: number; }[]' does not satisfy the constraint 'string'.
src/hooks/useSubscription.ts(133,42): error TS2345: Argument of type '{ user_uuid: string; new_tier: SubscriptionTier; new_stripe_customer_id: string | undefined; new_stripe_subscription_id: string | undefined; }' is not assignable to parameter of type 'undefined'.
src/lib/analytics.ts(160,17): error TS6133: '_sendToCustomEndpoint' is declared but its value is never read.
src/lib/dataExportService.ts(47,22): error TS2339: Property 'id' does not exist on type 'never'.
src/lib/dataExportService.ts(48,25): error TS2339: Property 'email' does not exist on type 'never'.
src/lib/dataExportService.ts(49,28): error TS2339: Property 'full_name' does not exist on type 'never'.
src/lib/dataExportService.ts(50,29): error TS2339: Property 'avatar_url' does not exist on type 'never'.
src/lib/dataExportService.ts(51,31): error TS2339: Property 'preferences' does not exist on type 'never'.
src/lib/dataExportService.ts(52,29): error TS2339: Property 'created_at' does not exist on type 'never'.
src/lib/dataExportService.ts(58,32): error TS2339: Property 'date' does not exist on type 'never'.
src/lib/dataExportService.ts(59,48): error TS2339: Property 'date' does not exist on type 'never'.
src/lib/dataExportService.ts(382,30): error TS2339: Property 'date' does not exist on type 'never'.
src/lib/dataExportService.ts(383,46): error TS2339: Property 'date' does not exist on type 'never'.
src/lib/errorMonitoring.ts(26,9): error TS2353: Object literal may only specify known properties, and 'tracePropagationTargets' does not exist in type 'Partial<BrowserTracingOptions>'.
src/lib/logger.ts(141,11): error TS6133: 'getConsoleStyle' is declared but its value is never read.
src/lib/monitoring/webVitals.ts(8,65): error TS2307: Cannot find module 'web-vitals' or its corresponding type declarations.
src/lib/validation.ts(11,7): error TS6133: '_patterns' is declared but its value is never read.
src/pages/Settings/PreferencesSection.tsx(44,17): error TS2339: Property 'preferences' does not exist on type 'never'.
src/pages/Settings/PreferencesSection.tsx(66,17): error TS2345: Argument of type '{ preferences: { language: AppLanguage; emailNotifications: boolean; insightsFrequency: "daily" | "weekly" | "monthly" | "never"; weeklyDigest: boolean; onThisDay: boolean; streakReminders: boolean; achievementNotifications: boolean; }; }' is not assignable to parameter of type 'never'.
src/pages/Settings/ProfileSection.tsx(32,27): error TS2339: Property 'full_name' does not exist on type 'never'.
src/pages/Settings/ProfileSection.tsx(33,28): error TS2339: Property 'avatar_url' does not exist on type 'never'.
src/pages/Settings/ProfileSection.tsx(46,17): error TS2345: Argument of type '{ full_name: string; avatar_url: string; }' is not assignable to parameter of type 'never'.
src/pages/Settings/SubscriptionSection.tsx(272,52): error TS2344: Type '{ on_waitlist: boolean; }' does not satisfy the constraint 'string'.
src/pages/Settings/SubscriptionSection.tsx(277,19): error TS2339: Property 'on_waitlist' does not exist on type 'GetRpcFunctionFilterBuilderByArgs<never, FnName, Args>["Result"]'.
src/pages/Settings/SubscriptionSection.tsx(293,50): error TS2344: Type '{ success: boolean; error?: string | undefined; }' does not satisfy the constraint 'string'.
src/pages/Settings/SubscriptionSection.tsx(299,17): error TS2339: Property 'success' does not exist on type 'GetRpcFunctionFilterBuilderByArgs<never, FnName, Args>["Result"]'.
src/pages/Settings/SubscriptionSection.tsx(303,25): error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string'.
src/pages/TherapistsPage.tsx(27,50): error TS2344: Type '{ success: boolean; error?: string | undefined; }' does not satisfy the constraint 'string'.
src/pages/TherapistsPage.tsx(39,17): error TS2339: Property 'success' does not exist on type 'GetRpcFunctionFilterBuilderByArgs<never, FnName, Args>["Result"]'.
src/pages/TherapistsPage.tsx(43,25): error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string'.
src/services/geminiService.ts(222,7): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
src/services/journal/journalService.ts(74,62): error TS2769: No overload matches this call.
  Overload 1 of 2, '(values: never, options?: { count?: "exact" | "planned" | "estimated" | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "journal_entries", never, "POST">', gave the following error.
    Argument of type 'Omit<DatabaseEntry, "id" | "created_at" | "updated_at">[]' is not assignable to parameter of type 'never'.
  Overload 2 of 2, '(values: never[], options?: { count?: "exact" | "planned" | "estimated" | undefined; defaultToNull?: boolean | undefined; } | undefined): PostgrestFilterBuilder<{ PostgrestVersion: "12"; }, never, never, null, "journal_entries", never, "POST">', gave the following error.
    Type 'Omit<DatabaseEntry, "id" | "created_at" | "updated_at">' is not assignable to type 'never'.
src/services/journal/journalService.ts(85,69): error TS2345: Argument of type 'Partial<Omit<DatabaseEntry, "id" | "created_at" | "user_id">>' is not assignable to parameter of type 'never'.
