import React from 'react';

interface EmptyStateProps {
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="flex items-center p-4">
      <div className="max-w-fit p-2 rounded-lg">
        {message}
      </div>
    </div>
  );
};

export default EmptyState; 