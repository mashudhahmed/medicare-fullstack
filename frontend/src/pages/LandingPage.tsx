import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaUserMd,
  FaCalendarCheck,
  FaHeartbeat,
  FaShieldAlt,
  FaPills,
  FaComments,
  FaFileMedical,
  FaArrowRight,
  FaCheckCircle,
  FaStar,
  FaBars,
  FaTimes,
  FaLock,
  FaHospitalUser,
} from 'react-icons/fa';

const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Sticky Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo and Name */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center">
              <img
                src="/logo.png"
                alt="MediCare Logo"
                className="h-10 w-10 rounded-xl object-contain bg-white p-1 shadow-md shadow-teal-700/10 border border-slate-100 group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-teal-700 transition-colors">
                MediCare
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-600">
                Healthcare Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">
              Features
            </a>
            <a href="#why-us" className="hover:text-teal-600 transition-colors">
              Why MediCare
            </a>
            <a href="#security" className="hover:text-teal-600 transition-colors">
              Security
            </a>
            <Link to="/doctors" className="hover:text-teal-600 transition-colors">
              Specialists
            </Link>
          </nav>

          {/* Top Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow transition-all duration-150"
              >
                Go to Dashboard
                <FaArrowRight className="text-xs" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white shadow-sm hover:bg-teal-700 hover:shadow transition-all duration-150"
                >
                  Get Started
                  <FaArrowRight className="text-xs" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600"
            >
              Features
            </a>
            <a
              href="#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600"
            >
              Why MediCare
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600"
            >
              Security
            </a>
            <Link
              to="/doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-teal-600"
            >
              Specialists
            </Link>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Simple, Classy & Modern */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-teal-50/25 to-slate-50 pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200/60">
        {/* Delicate Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* Minimalist Floating Accent Rings SVG */}
        <div className="absolute top-10 right-10 w-[420px] h-[420px] pointer-events-none opacity-25 hidden lg:block">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" stroke="#0d9488" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="200" cy="200" r="130" stroke="#0d9488" strokeWidth="1" opacity="0.6" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Refined Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold tracking-wide shadow-sm">
                <FaShieldAlt className="text-teal-600" />
                <span>Certified Clinical & Hospital Platform</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                Modern Healthcare,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-teal-800">
                  Effortlessly Connected.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Connect with certified specialists, manage real-time appointments, monitor vital signs,
                and receive official digital prescriptions with enterprise-grade clinical privacy.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all duration-150 transform hover:-translate-y-0.5"
                >
                  <FaCalendarCheck />
                  <span>Book an Appointment</span>
                </Link>
                <Link
                  to="/doctors"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all duration-150"
                >
                  <FaUserMd className="text-teal-600" />
                  <span>Explore Doctors</span>
                </Link>
              </div>

              {/* Trust Badges Row */}
              <div className="pt-6 border-t border-slate-200/70 grid grid-cols-3 gap-6 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-bold text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Verified Physicians</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-teal-600">24/7</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Real-Time Access</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Zero</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">Paper Workflows</div>
                </div>
              </div>
            </div>

            {/* Right Classy Clinical Showcase Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Main Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-slate-200/70 border border-slate-200/80 relative space-y-5">
                  {/* Doctor Profile Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100/80 flex items-center justify-center text-teal-600 p-3 shadow-inner">
                        <FaUserMd className="text-2xl" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">Dr. Sarah Jenkins, MD</h4>
                          <FaCheckCircle className="text-teal-600 text-xs" title="Verified Specialist" />
                        </div>
                        <p className="text-xs text-slate-500">Chief of Cardiology</p>
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <FaStar className="text-amber-400 text-xs" />
                          <span className="font-semibold text-slate-800">4.95</span>
                          <span className="text-slate-400">(1,400+ consultations)</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Available
                    </span>
                  </div>

                  {/* Scheduled Slot Preview */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Next Consultation Slot</span>
                      <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                        Today at 2:30 PM
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <FaCalendarCheck className="text-teal-600 text-xs" /> Instant Online Booking
                      </span>
                      <span className="text-slate-400">Video or In-Clinic</span>
                    </div>
                  </div>

                  {/* Minimalist Vitals Telemetry Strip */}
                  <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-2xl p-4 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FaHeartbeat className="text-rose-400 text-sm" />
                        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                          Live Telemetry
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-400">
                        Normal Sinus Rhythm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Heart Rate</span>
                      <span className="text-sm font-bold text-teal-300">
                        74 <span className="text-[10px] text-slate-400 font-normal">BPM</span>
                      </span>
                    </div>
                    {/* Delicate SVG Heartbeat Line */}
                    <div className="mt-2 pt-1 border-t border-slate-800">
                      <svg
                        className="w-full h-8 text-teal-400"
                        viewBox="0 0 320 40"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M0,20 L60,20 L75,8 L90,32 L105,4 L120,26 L135,20 L190,20 L205,8 L220,32 L235,4 L250,26 L265,20 L320,20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Micro Trust Guarantee Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <FaShieldAlt className="text-teal-600 text-xs" /> HIPAA Ready Privacy
                    </span>
                    <span>Encrypted Electronic Records</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="py-20 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700 mb-2">
              Comprehensive Capabilities
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Modern Clinical Care
            </h3>
            <p className="mt-3 text-base text-slate-600">
              MediCare delivers an integrated digital health ecosystem connecting patients, doctors,
              and healthcare administrators seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaUserMd />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Verified Specialists</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter and browse top-rated doctors across dozens of medical specialties with transparent ratings and credentials.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaCalendarCheck />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Instant Scheduling</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Book in-person or video consultations with live doctor availability and automated calendar reminders.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaHeartbeat />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Patient Vitals Telemetry</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log blood pressure, glucose, temperature, and BMI with clinical trend charts and abnormal value alerts.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaPills />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Drug Allergy & Safety Alerts</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automated clinical safety checks intercept contraindications, allergen cross-reactivity, and medication clashes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaComments />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Doctor-Patient Messaging</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Secure, direct messaging channels allow continuous post-appointment follow-ups and quick medical questions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-7 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-2xl mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <FaFileMedical />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">Official PDF Invoices & Rx</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Download formatted medical prescriptions and printable billing statements anytime directly from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose MediCare Section */}
      <section id="why-us" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-700">
                Clinical Precision & Trust
              </span>
              <h3 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Designed to Streamline Care for Every Role
              </h3>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Whether you are a patient seeking timely consultations, a doctor managing daily clinics,
                or a hospital administrator reviewing departmental metrics, MediCare provides specialized tools tailored to your workflow.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FaCheckCircle className="text-sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">For Patients</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Fast booking, symptom tracking, vitals history, and instant prescription access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FaCheckCircle className="text-sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">For Doctors</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unified appointment schedules, electronic health records, automated allergy checks, and real-time patient chat.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FaCheckCircle className="text-sm" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">For Administrators</h5>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Executive operational analytics, revenue summaries, CSV data exports, and complete audit logging.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Overview Feature Tile */}
            <div className="bg-gradient-to-br from-teal-50 via-slate-50 to-teal-100/50 p-8 rounded-3xl border border-teal-200/60 shadow-lg">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/70 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.png"
                      alt="MediCare"
                      className="h-8 w-8 rounded-lg object-contain bg-white p-0.5 border border-slate-200"
                    />
                    <span className="font-bold text-slate-900 text-sm">MediCare Hospital Hub</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Operational
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaHospitalUser className="text-teal-600 text-lg" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Total Consultations</p>
                        <p className="text-[11px] text-slate-500">Across all hospital departments</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-teal-700 text-sm">4,820+</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaLock className="text-teal-600 text-lg" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Security & Privacy</p>
                        <p className="text-[11px] text-slate-500">Role-based encrypted storage</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-sm">Active</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/register"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-teal-600 hover:bg-teal-700 text-white text-sm shadow transition"
                  >
                    <span>Create Your Patient Account</span>
                    <FaArrowRight className="text-xs" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full text-teal-400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="security-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#security-grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/80 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <FaLock className="text-teal-400" />
            <span>Strict Clinical Confidentiality</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Security That Puts Patient Privacy First
          </h3>
          <p className="mt-4 max-w-2xl mx-auto text-base text-slate-300 leading-relaxed">
            Healthcare data demands uncompromising protection. MediCare implements role-based access permissions,
            secure JWT token rotation, cryptographic password hashing, and complete audit logging.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
              <FaShieldAlt className="text-2xl text-teal-400 mb-3" />
              <h5 className="font-bold text-white text-base mb-1">Role-Based Access</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Granular permission guards ensure patients, doctors, and hospital administrators only access authorized records.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
              <FaLock className="text-2xl text-teal-400 mb-3" />
              <h5 className="font-bold text-white text-base mb-1">Encrypted Authentication</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Token-based sessions with optional Two-Factor Authentication (2FA) and instant credential revocation.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6">
              <FaFileMedical className="text-2xl text-teal-400 mb-3" />
              <h5 className="font-bold text-white text-base mb-1">Audit Trail & Compliance</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every clinical record query and appointment modification is logged with timestamps and operator identifiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section with Concentric SVG Rings */}
      <section className="relative py-20 bg-teal-700 text-white overflow-hidden">
        {/* Background Concentric SVG Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <svg className="w-[800px] h-[800px] text-white" viewBox="0 0 800 800" fill="none">
            <circle cx="400" cy="400" r="150" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="400" cy="400" r="250" stroke="currentColor" strokeWidth="2" />
            <circle cx="400" cy="400" r="350" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Manage Your Healthcare Journey?
          </h2>
          <p className="text-lg text-teal-100 max-w-2xl mx-auto mb-8 font-normal">
            Join thousands of patients and leading medical practitioners using MediCare for high-trust clinical workflows.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-teal-800 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-100 shadow-xl transition-all duration-150 transform hover:-translate-y-0.5"
            >
              <span>Create Free Account</span>
              <FaArrowRight className="text-sm" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-teal-800/80 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-teal-900 border border-teal-600 transition-colors"
            >
              <span>Sign In to Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Page Footer */}
      <footer className="bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand Column */}
            <div className="md:col-span-1 space-y-4">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="MediCare Logo"
                  className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 shadow-sm"
                />
                <span className="text-xl font-bold tracking-tight text-white">MediCare</span>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enterprise healthcare management connecting verified medical specialists with patients through real-time telemetry and secure record exchange.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-teal-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Patient Care</h6>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/doctors" className="hover:text-teal-400 transition-colors">
                    Find Specialists
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-teal-400 transition-colors">
                    Book Consultations
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-teal-400 transition-colors">
                    Health Vitals Monitor
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-teal-400 transition-colors">
                    Safety & Allergy Shield
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform & Roles */}
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Hospital Roles</h6>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/login" className="hover:text-teal-400 transition-colors">
                    Doctor Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-teal-400 transition-colors">
                    Patient Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-teal-400 transition-colors">
                    Hospital Administration
                  </Link>
                </li>
                <li>
                  <a href="#security" className="hover:text-teal-400 transition-colors">
                    Privacy Policy & Security
                  </a>
                </li>
              </ul>
            </div>

            {/* System Information */}
            <div>
              <h6 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Standards</h6>
              <div className="space-y-2 text-xs text-slate-400">
                <p>Enterprise Medical Security</p>
                <p>End-to-End Cryptographic Tokens</p>
                <p>Digital Prescription Verification</p>
                <p>Real-Time Celery Reminders</p>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>(c) {new Date().getFullYear()} MediCare Healthcare Management System. All rights reserved.</p>
            <p className="flex items-center gap-1.5 text-slate-400">
              Built for secure clinical workflows and patient care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;