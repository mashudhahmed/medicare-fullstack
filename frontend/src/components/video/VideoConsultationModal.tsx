import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhoneSlash,
  FaDesktop,
  FaShieldAlt,
  FaUserMd,
  FaUser,
  FaSpinner,
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

type CallStatus = 'initializing' | 'waiting' | 'connecting' | 'connected' | 'ended';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const VideoConsultationModal: React.FC<VideoConsultationModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
}) => {
  const [sessionData, setSessionData] = useState<VideoSessionData | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('initializing');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  const handleEndCall = useCallback(async () => {
    // Notify peer
    try {
      await appointmentsApi.postWebRTCSignal(appointmentId, 'leave');
    } catch {
      // ignore network errors on exit
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setCallStatus('ended');
    setDurationSeconds(0);
    processedSignalsRef.current.clear();
    onClose();
  }, [appointmentId, onClose]);

  // Duration timer
  useEffect(() => {
    if (!isOpen || callStatus !== 'connected') return;
    const timer = setInterval(() => {
      setDurationSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, callStatus]);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;
    processedSignalsRef.current.clear();

    const startSession = async () => {
      setCallStatus('initializing');
      try {
        const data = await appointmentsApi.getVideoSession(appointmentId);
        if (!isMounted) return;
        setSessionData(data);

        // 1. Get user camera & microphone
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch {
            toast.error('Unable to access camera or microphone. Please check permissions.');
            stream = new MediaStream();
          }
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // 3. Handle remote track
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('connected');
          }
        };

        // 4. Handle ICE candidate generation
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            appointmentsApi.postWebRTCSignal(appointmentId, 'candidate', event.candidate).catch(() => {});
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setCallStatus('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setCallStatus('waiting');
          }
        };

        setCallStatus('waiting');

        // 5. If Doctor, initialize as Offerer
        if (data.is_doctor) {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          await appointmentsApi.postWebRTCSignal(appointmentId, 'offer', offer);
        }

        // 6. Start signaling poll loop
        const pollSignals = async () => {
          if (!isMounted || !peerConnectionRef.current) return;
          try {
            const res = await appointmentsApi.getWebRTCSignals(appointmentId);
            const signals = res?.signals || [];

            for (const sig of signals) {
              const sigKey = `${sig.action}-${sig.sender}-${sig.timestamp || ''}`;
              if (processedSignalsRef.current.has(sigKey)) continue;

              if (sig.action === 'offer' && !data.is_doctor) {
                processedSignalsRef.current.add(sigKey);
                setCallStatus('connecting');
                if (sig.user_name) setRemotePeerName(sig.user_name);

                if (pc.signalingState === 'stable' || pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await appointmentsApi.postWebRTCSignal(appointmentId, 'answer', answer);
                }
              } else if (sig.action === 'answer' && data.is_doctor) {
                processedSignalsRef.current.add(sigKey);
                if (sig.user_name) setRemotePeerName(sig.user_name);

                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));
                  setCallStatus('connected');
                }
              } else if (sig.action === 'candidate') {
                processedSignalsRef.current.add(sigKey);
                if (pc.remoteDescription && sig.data) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(sig.data));
                  } catch {
                    // Candidate already added or queued
                  }
                }
              } else if (sig.action === 'leave') {
                processedSignalsRef.current.add(sigKey);
                setCallStatus('waiting');
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = null;
                }
                toast('Participant has left the room');
              }
            }
          } catch {
            // Signal polling transient error ignored
          }
        };

        // Poll every 1000ms
        const interval = setInterval(pollSignals, 1000);
        pollIntervalRef.current = interval;

        // Run first poll immediately
        pollSignals();
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || 'Failed to initialize video session');
        handleEndCall();
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [isOpen, appointmentId, handleEndCall]);

  if (!isOpen) return null;

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoDisabled(!track.enabled);
      });
    }
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !localStreamRef.current) return;

    if (isScreenSharing) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const camTrack = camStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender && camTrack) {
          sender.replaceTrack(camTrack);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = camStream;
        }
        setIsScreenSharing(false);
      } catch {
        // revert error ignored
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        screenTrack.onended = () => {
          setIsScreenSharing(false);
        };
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch {
        // User cancelled screen share picker
      }
    }
  };

  const formatTimer = (secs: number): string => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const roomName = sessionData?.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen overflow-hidden">
      {/* Top Clinical Header Bar */}
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
                <FaShieldAlt className="mr-1 text-[9px]" /> P2P WebRTC Encrypted
              </span>
              {callStatus === 'connected' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Live Connected
                </span>
              )}
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

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {callStatus === 'connected' && (
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-slate-300">
              <FaClock className="text-teal-400 text-[11px]" />
              <span>{formatTimer(durationSeconds)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleEndCall}
            className="inline-flex items-center text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-lg transition shadow-md"
            title="Leave and End Consultation"
          >
            <FaPhoneSlash className="mr-1.5 text-[11px]" />
            <span>End Call</span>
          </button>
        </div>
      </header>

      {/* Main Full-Bleed Video Canvas */}
      <main className="flex-1 min-h-0 w-full h-full relative bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Remote Video Stream (Main Feed) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain ${
            callStatus !== 'connected' ? 'hidden' : 'block'
          }`}
        />

        {/* Waiting / Connecting State Screen */}
        {callStatus !== 'connected' && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-lg z-10">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-1">
              {callStatus === 'initializing' ? (
                <FaSpinner className="text-3xl animate-spin" />
              ) : callStatus === 'connecting' ? (
                <FaSpinner className="text-3xl animate-spin" />
              ) : (
                <FaUserMd className="text-3xl" />
              )}
            </div>

            <h2 className="text-xl font-bold text-white">
              {callStatus === 'initializing'
                ? 'Initializing Telemedicine Session...'
                : callStatus === 'connecting'
                ? 'Connecting Peer-to-Peer Media Streams...'
                : 'Waiting for participant to connect...'}
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {callStatus === 'waiting'
                ? `Your camera and microphone are active. When the ${
                    sessionData?.is_doctor ? 'patient' : 'doctor'
                  } enters this room, the video connection will establish automatically.`
                : 'Negotiating direct browser-to-browser WebRTC connection with end-to-end encryption.'}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              Room ID: {roomName}
            </div>
          </div>
        )}

        {/* Local Video Preview (Picture in Picture) */}
        <div className="absolute bottom-24 right-4 sm:right-6 w-44 sm:w-60 aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 z-20">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute bottom-1.5 left-2 text-[10px] text-white/90 bg-black/70 px-2 py-0.5 rounded-md font-medium backdrop-blur-xs">
            You ({sessionData?.user_display_name || 'Participant'}) {isAudioMuted && '(Muted)'}
          </div>
        </div>

        {/* Remote Participant Label Overlay (when connected) */}
        {callStatus === 'connected' && remotePeerName && (
          <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg z-20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {remotePeerName}
          </div>
        )}
      </main>

      {/* Bottom Floating Telemedicine Controls Bar */}
      <footer className="bg-slate-900/95 backdrop-blur px-6 py-3.5 flex items-center justify-center gap-4 border-t border-slate-800 z-30 shrink-0">
        <button
          type="button"
          onClick={toggleAudio}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isAudioMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isAudioMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isVideoDisabled
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isVideoDisabled ? 'Start Video' : 'Stop Video'}
        >
          {isVideoDisabled ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleScreenShare}
          className={`p-3.5 rounded-2xl transition shadow-lg ${
            isScreenSharing
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <FaDesktop size={18} />
        </button>

        <button
          type="button"
          onClick={handleEndCall}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition flex items-center gap-2 shadow-lg"
          title="Leave and End Consultation"
        >
          <FaPhoneSlash size={16} /> End Call
        </button>
      </footer>
    </div>
  );
};

export default VideoConsultationModal;
