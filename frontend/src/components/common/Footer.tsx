import React from 'react';
import { FaHeart } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-600">
          <p>© 2026 MediCare. All rights reserved.</p>
          <p className="mt-1 flex items-center justify-center gap-1.5">
            <FaHeart className="text-teal-600 text-xs" /> Built with care for better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;