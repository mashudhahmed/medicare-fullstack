import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionText?: string;
  actionLink?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  actionLink,
}) => {
  return (
    <div className="card text-center py-12">
      <div className="text-4xl text-gray-300 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-medicare-dark mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {actionText && actionLink && (
        <Link to={actionLink} className="btn-primary inline-block">
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;