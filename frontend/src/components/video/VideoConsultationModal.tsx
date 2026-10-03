import React, { useEffect, useState, useCallback } from 'react';
import {
  FaVideo,
  FaShieldAlt,
  FaUserMd,
  FaUser,
  FaSpinner,
  FaExternalLinkAlt,
  FaPhoneSlash,
  FaClock,
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
  const [durationSeconds, setDurationSeconds] = useState(0);

  const handleClose = useCallback(() => {
    setLoading(true);
    setSessionData(null);
    setDurationSeconds(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;
    setLoading(true);
    setDurationSeconds(0);

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

  // Consultation duration timer
  useEffect(() => {
    if (!isOpen || loading) return;

    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, loading]);

  if (!isOpen) return null;

  const roomName = sessionData?.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;
  const displayName = encodeURIComponent(sessionData?.user_display_name || 'Participant');

  const configParams = [
    `userInfo.displayName="${displayName}"`,
    'config.prejoinPageEnabled=false',
    'config.disableDeepLinking=true',
    'config.hideConferenceSubject=true',
    'config.hideConferenceTimer=false',
    'config.startWithAudioMuted=false',
    'config.startWithVideoMuted=false',
    'config.enableWelcomePage=false',
    'config.enableClosePage=false',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_BRAND_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
  ].join('&');

  const jitsiUrl = `https://meet.jit.si/${roomName}#${configParams}`;

  const formatTimer = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handlePopOut = () => {
    window.open(jitsiUrl, '_blank', 'width=1280,height=800,menubar=no,toolbar=no,location=no');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      {/* Top Telemedicine Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
            <FaVideo className="text-base sm:text-lg" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Clinical Telemedicine Consultation
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-teal-950 text-teal-300 border border-teal-800 shrink-0">
                <FaShieldAlt className="mr-1 text-[9px]" /> P2P Encrypted
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Live
              </span>
            </div>

            {sessionData && (
              <div className="flex items-center space-x-2 sm:space-x-3 text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                <span className="flex items-center text-slate-300 truncate">
                  <FaUserMd className="mr-1 text-teal-400 shrink-0" /> Dr. {sessionData.doctor_name}
                </span>
                <span>•</span>
                <span className="flex items-center text-slate-300 truncate">
                  <FaUser className="mr-1 text-blue-400 shrink-0" /> Patient: {sessionData.patient_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Controls: Duration & Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-slate-300">
            <FaClock className="text-teal-400 text-[11px]" />
            <span>{formatTimer(durationSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={handlePopOut}
            className="inline-flex items-center text-xs text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 transition"
            title="Pop out video consultation to a dedicated browser window"
          >
            <FaExternalLinkAlt className="mr-1.5 text-[10px]" />
            <span className="hidden sm:inline">Pop Out Window</span>
            <span className="sm:hidden">Pop Out</span>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg transition shadow-md"
            title="Leave and Close Consultation"
          >
            <FaPhoneSlash className="mr-1.5 text-[11px]" />
            <span>Exit Call</span>
          </button>
        </div>
      </header>

      {/* Main Full-Bleed Video Stage */}
      <main className="flex-1 min-h-0 w-full h-full relative bg-slate-950 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <FaSpinner className="text-2xl animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Connecting Telemedicine Bridge...
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verifying session access, allocating private room credentials, and launching the clinical audio/video engine.
            </p>
          </div>
        ) : (
          <iframe
            title="Telemedicine Consultation Room"
            src={jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; speaker-selection"
            className="w-full h-full min-h-0 border-0 block"
          />
        )}
      </main>
    </div>
  );
};

export default VideoConsultationModal;
