import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-600">
          <p>© 2026 MediCare Hub. All rights reserved.</p>
          <p className="mt-1">
            <span className="text-medicare-teal">❤️</span> Built with care for better healthcare
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;