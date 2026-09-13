import React from 'react';
import Skeleton from './Skeleton';

const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} className="mt-2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton width="90%" height={14} />
        <Skeleton width="70%" height={14} />
        <Skeleton width="50%" height={14} />
      </div>
    </div>
  );
};

export default SkeletonCard;