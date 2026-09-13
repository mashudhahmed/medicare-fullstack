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
  FaTimes,
  FaSpinner,
} from 'react-icons/fa';
import api from '../../api/client';
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
  const [useBackupJitsi, setUseBackupJitsi] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const handleEndCall = useCallback(() => {
    // Notify peer
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ action: 'leave' }));
      } catch {
        // ignore
      }
    }

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setCallStatus('ended');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    let isMounted = true;

    const startSession = async () => {
      setCallStatus('initializing');
      try {
        const response = await api.get(`/appointments/${appointmentId}/video/`);
        if (!isMounted) return;
        setSessionData(response.data);

        const roomName = response.data.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;

        // Request local audio and video
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Camera/mic access error, attempting audio-only:', mediaErr);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          } catch {
            toast.error('Unable to access camera or microphone. Please check browser permissions.');
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

        // Initialize RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks to RTCPeerConnection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('connected');
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(
              JSON.stringify({
                action: 'ice-candidate',
                data: { candidate: event.candidate },
              })
            );
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setCallStatus('connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setCallStatus('waiting');
          }
        };

        // Connect to Django Channels Signaling WebSocket
        const token = localStorage.getItem('access_token');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = import.meta.env.VITE_WS_URL
          ? import.meta.env.VITE_WS_URL.replace(/^http/, 'ws')
          : `${wsProtocol}//${window.location.hostname}:8000/ws`;
        const wsUrl = `${wsHost}/video/${roomName}/?token=${token || ''}`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          setCallStatus('waiting');
          ws.send(JSON.stringify({ action: 'join' }));
        };

        ws.onmessage = async (event) => {
          try {
            const message = JSON.parse(event.data);
            const { action, data, user_info } = message;

            if (user_info?.user_name) {
              setRemotePeerName(user_info.user_name);
            }

            if (action === 'peer_joined') {
              // Create offer as the existing peer
              setCallStatus('connecting');
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(
                JSON.stringify({
                  action: 'offer',
                  data: { offer },
                })
              );
            } else if (action === 'offer') {
              // Answer incoming offer
              setCallStatus('connecting');
              const offerData = data.offer || data;
              await pc.setRemoteDescription(new RTCSessionDescription(offerData));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(
                JSON.stringify({
                  action: 'answer',
                  data: { answer },
                })
              );
            } else if (action === 'answer') {
              // Received answer
              const answerData = data.answer || data;
              await pc.setRemoteDescription(new RTCSessionDescription(answerData));
              setCallStatus('connected');
            } else if (action === 'ice-candidate') {
              const candidate = data.candidate || data;
              if (candidate) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch {
                  // Candidate processing error ignored
                }
              }
            } else if (action === 'peer_left') {
              setCallStatus('waiting');
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              toast('Participant left the room', { icon: 'ℹ️' });
            }
          } catch (err) {
            console.error('Signaling message error:', err);
          }
        };

        ws.onerror = () => {
          console.warn('Signaling WebSocket error. Available for local fallback.');
        };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || 'Failed to initialize video session');
        onClose();
      }
    };

    startSession();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isOpen, appointmentId, onClose]);

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
      } catch (err) {
        console.error('Failed to revert to camera:', err);
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

  const roomName = sessionData?.video_room_id || `medicare-${appointmentId.slice(0, 8)}`;
  const displayName = encodeURIComponent(sessionData?.user_display_name || 'Participant');
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl w-full max-w-6xl flex flex-col h-[88vh] border border-slate-800 relative">
        {/* Top Header */}
        <div className="bg-slate-800/90 backdrop-blur px-6 py-3.5 flex items-center justify-between border-b border-slate-700/60 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
              <FaVideo className="text-lg" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Telemedicine Consultation</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-900/60 text-teal-300 border border-teal-800">
                  <FaShieldAlt className="mr-1 text-[10px]" /> P2P Encrypted
                </span>
                {callStatus === 'connected' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-800">
                    Live
                  </span>
                )}
              </div>
              {sessionData && (
                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
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

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUseBackupJitsi(!useBackupJitsi)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
              title="Toggle between native WebRTC and external Jitsi engine"
            >
              {useBackupJitsi ? 'Use Native WebRTC' : 'Backup Engine'}
            </button>
            <button
              onClick={handleEndCall}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Close Consultation"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>
        </div>

        {/* Video Calling Canvas */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
          {useBackupJitsi ? (
            <iframe
              title="Backup Telemedicine Room"
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
            />
          ) : (
            <>
              {/* Remote Video (Main Stream) */}
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
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2">
                    {callStatus === 'initializing' ? (
                      <FaSpinner className="text-2xl animate-spin" />
                    ) : (
                      <FaUserMd className="text-3xl" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {callStatus === 'initializing'
                      ? 'Initializing Secure WebRTC Room...'
                      : callStatus === 'connecting'
                      ? 'Establishing Peer Connection...'
                      : 'Waiting for participant to join...'}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {callStatus === 'waiting'
                      ? `Your camera and microphone are ready. Share or open the appointment consultation to connect 1-on-1.`
                      : 'Connecting media streams and negotiating network routes via secure signaling...'}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 font-mono">
                    Room: {roomName}
                  </div>
                </div>
              )}

              {/* Local Video Preview (Picture in Picture) */}
              <div className="absolute bottom-24 right-4 w-44 sm:w-56 aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute bottom-1 left-2 text-[10px] text-white/90 bg-black/60 px-1.5 py-0.5 rounded font-medium backdrop-blur-xs">
                  You {isAudioMuted && '(Muted)'}
                </div>
              </div>

              {/* Participant Name Overlay (when connected) */}
              {callStatus === 'connected' && remotePeerName && (
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg z-10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {remotePeerName}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Floating Control Bar */}
        {!useBackupJitsi && (
          <div className="bg-slate-900/95 backdrop-blur px-6 py-4 flex items-center justify-center gap-4 border-t border-slate-800 z-20">
            <button
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
              onClick={handleEndCall}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-2xl font-semibold transition flex items-center gap-2 shadow-lg"
              title="Leave and End Consultation"
            >
              <FaPhoneSlash size={18} /> End Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConsultationModal;
