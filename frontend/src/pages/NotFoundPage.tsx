import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-medicare-teal">404</h1>
        <h2 className="text-3xl font-semibold text-medicare-dark mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary inline-block mt-6">
          <FaHome className="inline mr-2" /> Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;