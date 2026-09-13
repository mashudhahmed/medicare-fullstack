import React, { useEffect, useState } from 'react';
import { FaVideo, FaTimes, FaShieldAlt, FaUserMd, FaUser } from 'react-icons/fa';
import api from '../../api/client';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface VideoConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
}

interface VideoSessionData {
  appointment_id: string;
  video_room_id: string;
  doctor_name: string;
  patient_name: string;
  user_display_name: string;
  status: string;
  is_doctor: boolean;
}

export const VideoConsultationModal: React.FC<VideoConsultationModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionData, setSessionData] = useState<VideoSessionData | null>(null);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;
    const fetchSession = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/appointments/${appointmentId}/video/`);
        if (isMounted) {
          setSessionData(response.data);
        }
      } catch (error: any) {
        const msg = error.response?.data?.error || 'Failed to start video consultation session';
        toast.error(msg);
        if (isMounted) onClose();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointmentId, onClose]);

  if (!isOpen) return null;

  const roomName = sessionData?.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;
  const displayName = encodeURIComponent(sessionData?.user_display_name || 'Participant');
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-6xl flex flex-col h-[85vh] border border-gray-700">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FaVideo className="text-xl" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">Telemedicine Video Consultation</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-900 text-emerald-300">
                  <FaShieldAlt className="mr-1 text-[10px]" /> Encrypted
                </span>
              </div>
              {sessionData && (
                <div className="flex items-center space-x-3 text-xs text-gray-400 mt-0.5">
                  <span className="flex items-center">
                    <FaUserMd className="mr-1 text-teal-400" /> Dr. {sessionData.doctor_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center">
                    <FaUser className="mr-1 text-blue-400" /> Patient: {sessionData.patient_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition"
            title="End or Leave Consultation"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Video Frame */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-white">
              <LoadingSpinner />
              <p className="text-sm text-gray-300">Connecting to secure medical room...</p>
            </div>
          ) : (
            <iframe
              title="Telemedicine Video Consultation"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-3 flex items-center justify-between text-xs text-gray-400 border-t border-gray-700">
          <span>MediCare Hub Telemedicine Platform</span>
          <button
            onClick={onClose}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-medium transition"
          >
            Leave Call
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConsultationModal;
