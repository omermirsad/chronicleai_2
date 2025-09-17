// Fix: Import jest globals to resolve TypeScript errors about missing types.
import { describe, it, expect, jest } from '@jest/globals';
// @ts-ignore
import { renderHook, act } from '@testing-library/react';
import { useJournal } from './useJournal';
import { supabase } from '../integrations/supabase/client';

// Mock Supabase client
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('useJournal', () => {
  it('should fetch entries on auth change', async () => {
    // Mock implementation
    const mockUser = { id: '123' };
    const mockEntries = [{ id: '1', text: 'Test entry' }];
    
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: mockUser } } });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockEntries, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => useJournal());

    // Wait for effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.entries).toEqual(mockEntries);
  });
});
