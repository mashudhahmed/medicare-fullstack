import React, { useEffect, useState, useCallback } from 'react';
import {
  FaVideo,
  FaShieldAlt,
  FaUserMd,
  FaUser,
  FaTimes,
  FaSpinner,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { appointmentsApi } from '../../api/appointments';
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
  const [sessionData, setSessionData] = useState<VideoSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleClose = useCallback(() => {
    setLoading(true);
    setSessionData(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;
    setLoading(true);

    const initSession = async () => {
      try {
        const data = await appointmentsApi.getVideoSession(appointmentId);
        if (!isMounted) return;
        setSessionData(data);
      } catch (error: unknown) {
        if (!isMounted) return;
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || 'Failed to initialize video consultation session');
        handleClose();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, [isOpen, appointmentId, handleClose]);

  if (!isOpen) return null;

  const roomName = sessionData?.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;
  const displayName = encodeURIComponent(sessionData?.user_display_name || 'Participant');
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl w-full max-w-6xl flex flex-col h-[90vh] border border-slate-800 relative">
        {/* Top Header */}
        <div className="bg-slate-800/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between border-b border-slate-700/60 z-20 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <FaVideo className="text-lg" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  Telemedicine Consultation
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-teal-900/60 text-teal-300 border border-teal-800 shrink-0">
                  <FaShieldAlt className="mr-1 text-[9px]" /> Encrypted
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-800 shrink-0">
                  Live
                </span>
              </div>
              {sessionData && (
                <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                  <span className="flex items-center truncate">
                    <FaUserMd className="mr-1 text-teal-400 shrink-0" /> Dr. {sessionData.doctor_name}
                  </span>
                  <span>•</span>
                  <span className="flex items-center truncate">
                    <FaUser className="mr-1 text-blue-400 shrink-0" /> Patient: {sessionData.patient_name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
              title="Open consultation in a new browser tab"
            >
              <FaExternalLinkAlt className="mr-1.5 text-[11px]" /> Pop Out
            </a>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Close Consultation"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <FaSpinner className="text-2xl animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Preparing Telemedicine Room...
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Verifying consultation credentials and initializing secure encrypted audio/video bridge.
              </p>
            </div>
          ) : (
            <iframe
              title="Telemedicine Consultation Room"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker-selection"
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConsultationModal;
