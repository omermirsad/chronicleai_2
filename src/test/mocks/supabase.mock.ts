import { vi } from 'vitest';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { createMockSupabaseUser } from './user.mock';

export const createMockSupabaseClient = (options?: {
  user?: User | null;
  session?: Session | null;
}): Partial<SupabaseClient> => {
  const mockUser = options?.user || createMockSupabaseUser();
  const mockSession = options?.session || {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  const mockAuthChangeCallback = vi.fn();

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      onAuthStateChange: vi.fn((callback) => {
        mockAuthChangeCallback.mockImplementation(callback);
        // Call immediately with current session
        callback('SIGNED_IN', mockSession);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    } as any,
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    storage: {
      from: vi.fn((bucket: string) => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test/path/file.jpg' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(['test']),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        list: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test.jpg' },
        }),
      })),
    } as any,
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  };
};

export const mockSupabaseAuth = (user: User | null = null) => {
  const mockUser = user || createMockSupabaseUser();
  const mockSession = user
    ? {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer' as const,
        user: mockUser,
      }
    : null;

  return {
    getSession: vi.fn().mockResolvedValue({
      data: { session: mockSession },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    }),
    onAuthStateChange: vi.fn((callback) => {
      if (mockSession) {
        callback('SIGNED_IN', mockSession);
      }
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      };
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
};

export const mockSupabaseQuery = (mockData: any = [], mockError: any = null) => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: mockError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData[0] || null, error: mockError }),
    then: vi.fn((resolve) =>
      resolve({ data: mockData, error: mockError, count: mockData?.length || 0 })
    ),
  };

  return chainable;
};
