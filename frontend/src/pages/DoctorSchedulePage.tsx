import React, { useState, useEffect } from 'react';
import { doctorsApi } from '../api/doctors';
import { Doctor } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  FaCalendarAlt,
  FaClock,
  FaDollarSign,
  FaCheck,
  FaSave,
  FaInfoCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const DoctorSchedulePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Doctor | null>(null);

  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('17:00');
  const [fee, setFee] = useState('50.00');

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        const data = await doctorsApi.getMyProfile();
        setProfile(data);

        // Normalize available_days to lowercase string list
        const days = (data.available_days || []).map((d: string | number) =>
          typeof d === 'string' ? d.toLowerCase() : DAYS_OF_WEEK[d]?.key || String(d)
        );
        setAvailableDays(days.length > 0 ? days : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);

        if (data.available_time_start) {
          setTimeStart(data.available_time_start.slice(0, 5));
        }
        if (data.available_time_end) {
          setTimeEnd(data.available_time_end.slice(0, 5));
        }
        if (data.consultation_fee) {
          setFee(String(data.consultation_fee));
        }
      } catch {
        toast.error('Failed to load doctor schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  const toggleDay = (dayKey: string) => {
    if (availableDays.includes(dayKey)) {
      setAvailableDays(availableDays.filter((d) => d !== dayKey));
    } else {
      setAvailableDays([...availableDays, dayKey]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availableDays.length === 0) {
      toast.error('Please select at least one available working day');
      return;
    }

    if (timeStart >= timeEnd) {
      toast.error('Available start time must be before end time');
      return;
    }

    setSaving(true);
    try {
      const updated = await doctorsApi.updateMyProfile({
        available_days: availableDays,
        available_time_start: `${timeStart}:00`,
        available_time_end: `${timeEnd}:00`,
        consultation_fee: fee,
      });
      setProfile(updated);
      toast.success('Schedule & availability saved successfully');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaCalendarAlt className="text-medicare-primary" />
          Schedule & Consultation Settings
          {profile?.user?.full_name && (
            <span className="text-sm font-normal text-gray-500">
              — Dr. {profile.user.full_name} ({profile.specialty || 'General Practice'})
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500">
          Configure your active practice days, working hours, and standard consultation fees. Patients will only be allowed to book appointments within these configured slots.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Working Days Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FaCalendarAlt className="text-medicare-primary text-sm" />
            Working Days
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Select the days of the week on which you are available to accept patient consultations.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = availableDays.includes(day.key);
              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => toggleDay(day.key)}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'border-medicare-primary bg-teal-50 text-medicare-primary font-semibold shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-sm">{day.label.slice(0, 3)}</span>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isSelected ? 'bg-medicare-primary text-white' : 'border border-gray-300'
                    }`}
                  >
                    {isSelected && <FaCheck />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Working Hours & Fee Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FaClock className="text-medicare-primary text-sm" />
            Working Hours & Consultation Fee
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Specify your daily practice hours and fee per 30-minute consultation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="label">Start Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Earliest appointment start</span>
            </div>

            <div>
              <label className="label">End Time</label>
              <div className="relative">
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Latest appointment end</span>
            </div>

            <div>
              <label className="label">Consultation Fee ($ USD)</label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="input-field pl-8"
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Billed to patient per session</span>
            </div>
          </div>
        </div>

        {/* Status / Summary Info */}
        <div className="p-4 bg-teal-50 rounded-xl border border-teal-100 flex items-start gap-3 text-xs text-teal-900">
          <FaInfoCircle className="text-medicare-primary text-base shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Automated Slot Generation</span>
            Appointments are automatically segmented into 30-minute consultation slots between{' '}
            <strong>{timeStart}</strong> and <strong>{timeEnd}</strong> on active days (
            {availableDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') || 'None'}).
            Already booked slots are automatically excluded when patients schedule appointments.
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-6 py-2.5"
          >
            <FaSave />
            {saving ? 'Saving Schedule...' : 'Save Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorSchedulePage;
