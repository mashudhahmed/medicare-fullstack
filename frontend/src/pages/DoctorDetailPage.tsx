import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorsApi } from '../api/doctors';
import { appointmentsApi } from '../api/appointments';
import { reviewsApi } from '../api/reviews';
import { Doctor, DoctorReview } from '../types';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui';
import {
  FaStethoscope,
  FaClock,
  FaCheckCircle,
  FaArrowLeft,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaBookmark,
  FaStar,
  FaRegStar,
  FaCommentDots,
  FaTrash,
  FaUserCheck,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface BookingData {
  appointment_date: string;
  reason: string;
  notes: string;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [bookingData, setBookingData] = useState<BookingData>({
    appointment_date: '',
    reason: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [doctorData, reviewsData] = await Promise.all([
        doctorsApi.getById(id),
        reviewsApi.getDoctorReviews(id).catch(() => []),
      ]);
      setDoctor(doctorData);
      setReviews(reviewsData);
    } catch {
      toast.error('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to book an appointment');
      navigate('/login');
      return;
    }

    if (user.role !== 'patient') {
      toast.error('Only patients can book appointments');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentsApi.create({
        doctor: id!,
        appointment_date: bookingData.appointment_date,
        reason: bookingData.reason,
        notes: bookingData.notes,
      });
      toast.success('Appointment booked successfully!');
      setShowBooking(false);
      navigate('/appointments');
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.error || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }
    if (user.role !== 'patient') {
      toast.error('Only patients can write reviews');
      return;
    }
    if (!id) return;

    setSubmittingReview(true);
    try {
      await reviewsApi.create({
        doctor: id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('Thank you! Your review has been submitted.');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      await loadData();
    } catch (error: unknown) {
      const apiError = error as ApiError;
      toast.error(apiError.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await reviewsApi.delete(reviewId);
      toast.success('Review removed');
      await loadData();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const ratingLabels: Record<number, string> = {
    1: 'Poor Experience',
    2: 'Fair / Below Expectation',
    3: 'Good Consultation',
    4: 'Very Good & Helpful',
    5: 'Excellent & Highly Recommended',
  };

  if (loading) return <LoadingSpinner />;
  if (!doctor) return <div className="text-center py-12">Doctor not found</div>;

  const averageScore = doctor.average_rating || (reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0');

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-medicare-teal transition"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {/* Doctor Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-medicare-teal to-teal-600 px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-medicare-teal shadow-md overflow-hidden relative shrink-0">
              {doctor.user.profile_picture ? (
                <img
                  src={doctor.user.profile_picture}
                  alt={doctor.user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{doctor.user.full_name?.charAt(0) || 'D'}</span>
              )}
            </div>

            <div className="mt-4 sm:mt-0 sm:ml-6 text-white flex-1">
              <h1 className="text-2xl font-bold">Dr. {doctor.user.full_name}</h1>
              <p className="text-teal-100 text-lg capitalize">{doctor.specialty} Specialist</p>

              <div className="flex items-center justify-center sm:justify-start gap-3 mt-3 flex-wrap">
                {doctor.is_verified ? (
                  <span className="flex items-center bg-green-500/25 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    <FaCheckCircle className="mr-1" /> Verified Physician
                  </span>
                ) : (
                  <span className="flex items-center bg-yellow-500/25 px-3 py-1 rounded-full text-xs font-semibold">
                    Pending Verification
                  </span>
                )}

                <span className="flex items-center bg-amber-400/30 text-amber-100 px-3 py-1 rounded-full text-xs font-bold border border-amber-300/30">
                  <FaStar className="mr-1.5 text-amber-300" />
                  {averageScore} / 5.0 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Doctor Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-600">
              <FaStethoscope className="mr-3 text-medicare-teal shrink-0" />
              <span><b>Qualification:</b> {doctor.qualification}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaClock className="mr-3 text-medicare-teal shrink-0" />
              <span><b>Experience:</b> {doctor.experience_years} years</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaMoneyBillWave className="mr-3 text-medicare-teal shrink-0" />
              <span><b>Consultation Fee:</b> ${doctor.consultation_fee}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <FaEnvelope className="mr-3 text-medicare-teal shrink-0" />
              <span><b>Email:</b> {doctor.user.email}</span>
            </div>
            {doctor.user.phone && (
              <div className="flex items-center text-gray-600">
                <FaPhone className="mr-3 text-medicare-teal shrink-0" />
                <span><b>Phone:</b> {doctor.user.phone}</span>
              </div>
            )}
            {doctor.license_number && (
              <div className="flex items-center text-gray-600">
                <FaUserCheck className="mr-3 text-medicare-teal shrink-0" />
                <span><b>License:</b> {doctor.license_number}</span>
              </div>
            )}
            {doctor.user.address && (
              <div className="flex items-center text-gray-600 col-span-1 md:col-span-2">
                <FaMapMarkerAlt className="mr-3 text-medicare-teal shrink-0" />
                <span><b>Clinic / Address:</b> {doctor.user.address}</span>
              </div>
            )}
          </div>

          {/* Availability */}
          {doctor.available_days && doctor.available_days.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-medicare-dark mb-2 text-sm">Consultation Availability</h3>
              <div className="flex flex-wrap gap-2">
                {doctor.available_days.map((day) => (
                  <span key={day} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 capitalize">
                    {day}
                  </span>
                ))}
              </div>
              {doctor.available_time_start && doctor.available_time_end && (
                <p className="text-xs text-gray-500 mt-2">
                  <FaClock className="inline mr-1" /> Active consultation hours: {doctor.available_time_start} - {doctor.available_time_end}
                </p>
              )}
            </div>
          )}

          {/* Book Button */}
          {user?.role === 'patient' && (
            <button
              onClick={() => setShowBooking(true)}
              className="btn-primary w-full py-3 text-base flex items-center justify-center font-semibold shadow-md"
            >
              <FaBookmark className="mr-2" /> Book Consultation with Dr. {doctor.user.full_name}
            </button>
          )}
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FaStar className="text-amber-400" />
              Patient Reviews & Feedback
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Verified clinical consultations and patient satisfaction ratings.
            </p>
          </div>

          {user?.role === 'patient' && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <FaCommentDots /> Write a Review
            </button>
          )}
        </div>

        {/* Rating Breakdown & Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl">
          <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0">
            <span className="text-4xl font-extrabold text-gray-900">{averageScore}</span>
            <div className="flex text-amber-400 my-1 text-sm">
              {[1, 2, 3, 4, 5].map((s) => (
                <FaStar key={s} className={s <= Math.round(Number(averageScore)) ? 'text-amber-400' : 'text-gray-300'} />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">Based on {reviews.length} total ratings</span>
          </div>

          <div className="col-span-2 space-y-1.5 justify-center flex flex-col">
            {ratingCounts.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center text-xs gap-3">
                <span className="w-12 font-medium text-gray-600">{star} stars</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-8 text-right text-gray-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4 pt-2">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaCommentDots className="text-3xl mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No reviews yet for Dr. {doctor.user.full_name}.</p>
              <p className="text-xs text-gray-400 mt-0.5">Be the first patient to share your consultation experience.</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition bg-white space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {rev.patient_avatar ? (
                        <img src={rev.patient_avatar} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        rev.patient_name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-gray-900">{rev.patient_name}</p>
                      <p className="text-[11px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-xs">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <FaStar key={s} className={s <= rev.rating ? 'text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                    {(user?.role === 'admin' || (user?.email && rev.patient_name === user.full_name)) && (
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        className="text-gray-400 hover:text-red-500 text-xs p-1 ml-1"
                        title="Delete review"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-gray-700 leading-relaxed pl-10">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">Book Consultation</h2>
            <p className="text-xs text-gray-600 mb-4">
              with Dr. {doctor.user.full_name} ({doctor.specialty})
            </p>
            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={bookingData.appointment_date}
                  onChange={(e) => setBookingData({ ...bookingData, appointment_date: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div>
                <label className="label">Reason for Visit</label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  required
                  placeholder="e.g. Chest pain checkup, routine follow-up"
                />
              </div>
              <div>
                <label className="label">Additional Notes (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Any symptoms, prior records, or notes"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1 text-sm" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBooking(false)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Write a Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Review Dr. ${doctor.user.full_name}`}
        description="Share your honest feedback to help other patients make informed healthcare choices."
        size="md"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="text-center py-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Select Your Rating *
            </label>
            <div className="flex justify-center gap-2 text-2xl my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(null)}
                  className="focus:outline-none transition-transform hover:scale-125"
                >
                  {star <= (reviewHoverRating || reviewRating) ? (
                    <FaStar className="text-amber-400" />
                  ) : (
                    <FaRegStar className="text-gray-300" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-amber-600">
              {ratingLabels[reviewHoverRating || reviewRating]}
            </p>
          </div>

          <div>
            <label className="label">Your Feedback / Review (Optional)</label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Describe your consultation experience, the doctor's professionalism, diagnosis clarity, and advice..."
              className="input-field text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="btn-secondary text-xs"
              disabled={submittingReview}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DoctorDetailPage;