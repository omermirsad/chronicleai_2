import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  downloadDataAsJSON,
  downloadEntriesAsCSV,
  downloadEntriesAsText,
  requestAccountDeletion,
  getUserDataStats,
} from '../../lib/dataExportService';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { TOAST_MESSAGES } from '../../constants';

interface DataStats {
  totalEntries: number;
  dateRange: {
    first?: string;
    last?: string;
  };
  estimatedSizeKB: number;
}

export const DataManagementSection: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadDataStats();
    }
  }, [user]);

  const loadDataStats = async () => {
    if (!user) return;

    try {
      const stats = await getUserDataStats(user.id);
      setDataStats(stats);
    } catch (error) {
      // Silent fail on load
    }
  };

  const { execute: handleExportJSON, loading: exportingJSON } = useAsyncAction(
    async () => {
      if (!user) return;
      await downloadDataAsJSON(user.id);
    },
    {
      successMessage: TOAST_MESSAGES.DATA_EXPORTED,
      errorMessage: TOAST_MESSAGES.DATA_EXPORT_ERROR,
    }
  );

  const { execute: handleExportCSV, loading: exportingCSV } = useAsyncAction(
    async () => {
      if (!user) return;
      await downloadEntriesAsCSV(user.id);
    },
    {
      successMessage: TOAST_MESSAGES.DATA_EXPORTED,
      errorMessage: TOAST_MESSAGES.DATA_EXPORT_ERROR,
    }
  );

  const { execute: handleExportText, loading: exportingText } = useAsyncAction(
    async () => {
      if (!user) return;
      await downloadEntriesAsText(user.id);
    },
    {
      successMessage: TOAST_MESSAGES.DATA_EXPORTED,
      errorMessage: TOAST_MESSAGES.DATA_EXPORT_ERROR,
    }
  );

  const { execute: handleDeleteAccount, loading: deleting } = useAsyncAction(
    async () => {
      if (!user) return;

      if (deleteConfirmation !== 'DELETE') {
        throw new Error('Please type DELETE to confirm');
      }

      await requestAccountDeletion();
      await signOut();
      navigate('/');
    },
    {
      successMessage: 'Account deletion initiated. You will be logged out.',
      errorMessage: 'Failed to delete account. Please try again or contact support.',
    }
  );

  const loading = exportingJSON || exportingCSV || exportingText || deleting;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
      <h3 className="text-xl font-semibold text-stone-800 mb-2">
        Data & Account Management
      </h3>
      <p className="text-sm text-stone-600 mb-6">
        Export your data or delete your account
      </p>

      {/* Data Stats */}
      {dataStats && (
        <div className="bg-stone-50 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-semibold text-stone-700 mb-2">
            Your Data
          </h4>
          <div className="space-y-1 text-sm text-stone-600">
            <p>Total Entries: {dataStats.totalEntries}</p>
            {dataStats.dateRange.first && (
              <p>
                Date Range: {new Date(dataStats.dateRange.first).toLocaleDateString()} -{' '}
                {dataStats.dateRange.last
                  ? new Date(dataStats.dateRange.last).toLocaleDateString()
                  : 'Now'}
              </p>
            )}
            <p>Estimated Size: {dataStats.estimatedSizeKB} KB</p>
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="space-y-3 mb-8">
        <h4 className="text-sm font-semibold text-stone-700">
          Export Your Data
        </h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
          >
            {exportingJSON ? 'Exporting...' : 'Export as JSON'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
          >
            {exportingCSV ? 'Exporting...' : 'Export as CSV'}
          </button>
          <button
            onClick={handleExportText}
            disabled={loading}
            className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
          >
            {exportingText ? 'Exporting...' : 'Export as Text'}
          </button>
        </div>
      </div>

      {/* Delete Account - Danger Zone */}
      <div className="pt-6 border-t border-stone-200">
        <h4 className="text-sm font-semibold text-red-600 mb-2">
          Danger Zone
        </h4>
        <p className="text-sm text-stone-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-200"
        >
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              Delete Account
            </h3>
            <p className="text-stone-600 mb-4">
              This action cannot be undone. All your entries, data, and settings will be permanently deleted.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Type <span className="font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
