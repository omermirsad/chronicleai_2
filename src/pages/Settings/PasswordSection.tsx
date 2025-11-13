import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { TOAST_MESSAGES, VALIDATION } from '../../constants';
import toast from 'react-hot-toast';

export const PasswordSection: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { execute: handleChangePassword, loading } = useAsyncAction(
    async () => {
      // Validation
      if (!newPassword || !confirmPassword) {
        throw new Error(TOAST_MESSAGES.REQUIRED_FIELD);
      }

      if (newPassword !== confirmPassword) {
        throw new Error(TOAST_MESSAGES.PASSWORDS_DONT_MATCH);
      }

      if (newPassword.length < VALIDATION.PASSWORD_MIN_LENGTH) {
        throw new Error(TOAST_MESSAGES.PASSWORD_TOO_SHORT);
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Clear form on success
      setNewPassword('');
      setConfirmPassword('');
    },
    {
      successMessage: TOAST_MESSAGES.PASSWORD_CHANGED,
      errorMessage: TOAST_MESSAGES.PASSWORD_CHANGE_ERROR,
    }
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
      <h3 className="text-xl font-semibold text-stone-800 mb-4">
        Change Password
      </h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-stone-700 mb-2">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            minLength={VALIDATION.PASSWORD_MIN_LENGTH}
          />
          <p className="text-xs text-stone-500 mt-1">
            Password must be at least {VALIDATION.PASSWORD_MIN_LENGTH} characters
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-stone-700 mb-2">
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition disabled:opacity-50"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </div>
  );
};
