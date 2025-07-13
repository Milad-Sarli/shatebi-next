import React from 'react';

interface ActionButtonsProps {
  studentId: number;
  loading: boolean;
  actionLoading: boolean;
  handleAddNumber: (studentId: number) => void;
  handleProvideless: (studentId: number) => void;
  handleAbsent: (studentId: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectedStudentForAction: any;
  isProvideConfirmOpen: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  studentId,
  loading,
  actionLoading,
  handleAddNumber,
  handleProvideless,
  handleAbsent,
  selectedStudentForAction,
  isProvideConfirmOpen,
}) => {
  // Real action buttons UI from main page
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => handleAddNumber(studentId)}
        disabled={loading || actionLoading}
        className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-zinc-900 dark:hover:bg-emerald-400 transition-colors duration-200 rounded px-3 py-1 text-sm mb-1"
      >
        افزودن نمره
      </button>
      <div className="flex gap-1">
        <button
          onClick={() => handleProvideless(studentId)}
          disabled={loading || actionLoading}
          className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-zinc-900 dark:hover:bg-orange-400 transition-colors duration-200 text-xs px-2 py-1 rounded"
        >
          {/* Show loading if this is the selected student and confirm modal is open */}
          {actionLoading && selectedStudentForAction?.id === studentId && isProvideConfirmOpen ? (
            <span className="flex items-center gap-1">
              <span className="loader inline-block w-3 h-3 border-2 border-t-2 border-white rounded-full animate-spin"></span>
              <span>درحال...</span>
            </span>
          ) : (
            "عدم تحویل"
          )}
        </button>
        <button
          onClick={() => handleAbsent(studentId)}
          disabled={loading || actionLoading}
          className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:text-zinc-900 dark:hover:bg-red-400 transition-colors duration-200 text-xs px-2 py-1 rounded"
        >
          غایب
        </button>
      </div>
    </div>
  );
};

export default ActionButtons; 