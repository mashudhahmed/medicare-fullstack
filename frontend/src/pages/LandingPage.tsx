import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaUserMd, FaClock, FaArrowRight } from 'react-icons/fa';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-medicare-teal to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Your Health, Our Priority
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect with trusted doctors, book appointments, and manage your healthcare journey with MediCare Hub.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register" className="bg-white text-medicare-teal px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
            <Link to="/doctors" className="bg-teal-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-800 transition-colors">
              Find Doctors
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-medicare-dark mb-12">
            Why Choose MediCare Hub?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-medicare-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserMd className="text-3xl text-medicare-teal" />
              </div>
              <h3 className="text-xl font-semibold text-medicare-dark mb-2">Trusted Doctors</h3>
              <p className="text-gray-600">Verified and experienced medical professionals at your service.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-medicare-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-3xl text-medicare-teal" />
              </div>
              <h3 className="text-xl font-semibold text-medicare-dark mb-2">Easy Booking</h3>
              <p className="text-gray-600">Book appointments in minutes with real-time availability.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="w-16 h-16 bg-medicare-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="text-3xl text-medicare-teal" />
              </div>
              <h3 className="text-xl font-semibold text-medicare-dark mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your health data is protected with enterprise-grade security.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-medicare-teal text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-8">Join thousands of patients who trust MediCare Hub for their healthcare needs.</p>
          <Link to="/register" className="inline-flex items-center bg-white text-medicare-teal px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Create Account <FaArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;