import React from 'react';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { useOfflineSupport } from '../hooks/useOfflineSupport';

interface OfflineIndicatorProps {
  className?: string;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className = '' }) => {
  const { isOnline, isOfflineMode, queueLength, syncPendingChanges } = useOfflineSupport();

  if (isOnline && queueLength === 0) {
    return null; // Don't show anything when online with no pending changes
  }

  return (
    <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className={`
        flex items-center gap-3 px-4 py-2 rounded-lg shadow-lg border backdrop-blur-sm
        ${isOfflineMode 
          ? 'bg-orange-100 border-orange-300 text-orange-800' 
          : queueLength > 0 
            ? 'bg-blue-100 border-blue-300 text-blue-800'
            : 'bg-green-100 border-green-300 text-green-800'
        }
      `}>
        {isOfflineMode ? (
          <>
            <ExclamationTriangleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Offline Mode</span>
            <span className="text-xs opacity-75">Changes will sync when online</span>
          </>
        ) : queueLength > 0 ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Syncing {queueLength} changes...</span>
            <button
              onClick={syncPendingChanges}
              className="text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">All changes synced</span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
