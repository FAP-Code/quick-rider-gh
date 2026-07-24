'use client';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

export default function WebRTCCallPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId') ?? '';
  const role = searchParams.get('role') ?? 'customer'; // 'customer' | 'rider'

  const localRef  = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const wsRef     = useRef<WebSocket | null>(null);

  const [status, setStatus]     = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [muted, setMuted]       = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let timer: ReturnType<typeof setInterval>;

    async function start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }).catch(() =>
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      );
      if (localRef.current) localRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = e => {
        if (remoteRef.current) remoteRef.current.srcObject = e.streams[0];
        setStatus('connected');
        timer = setInterval(() => setDuration(d => d + 1), 1000);
      };

      const socketUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1')
        .replace(/^http/, 'ws')
        .replace('/api/v1', '') + '/webrtc';

      const ws = new WebSocket(`${socketUrl}?orderId=${orderId}&role=${role}`);
      wsRef.current = ws;

      ws.onmessage = async ({ data }) => {
        const msg = JSON.parse(data);
        if (msg.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          ws.send(JSON.stringify({ type: 'answer', sdp: answer, orderId, role }));
        } else if (msg.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
        } else if (msg.type === 'ice') {
          await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.type === 'hangup') {
          endCall();
        }
      };

      ws.onopen = async () => {
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) ws.send(JSON.stringify({ type: 'ice', candidate, orderId, role }));
        };
        if (role === 'customer') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: 'offer', sdp: offer, orderId, role }));
        }
      };
    }

    start().catch(err => {
      console.error('WebRTC error:', err);
      setStatus('ended');
    });

    return () => {
      clearInterval(timer);
      endCall();
    };
  }, [orderId, role]);

  function endCall() {
    pcRef.current?.close();
    wsRef.current?.close();
    setStatus('ended');
  }

  function toggleMute() {
    const stream = localRef.current?.srcObject as MediaStream | null;
    stream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMuted(m => !m);
  }

  function toggleVideo() {
    const stream = localRef.current?.srcObject as MediaStream | null;
    stream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setVideoOff(v => !v);
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  if (status === 'ended') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-600/20 flex items-center justify-center mx-auto">
            <PhoneOff size={36} className="text-red-400" />
          </div>
          <p className="text-xl font-semibold">Call Ended</p>
          <p className="text-gray-400">Duration: {fmt(duration)}</p>
          <button onClick={() => router.back()}
            className="px-6 py-2 bg-green-700 hover:bg-green-600 rounded-xl text-sm font-medium transition-colors">
            Back to Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white relative">
      {/* Remote video (full screen) */}
      <video ref={remoteRef} autoPlay playsInline
        className="w-full max-w-lg aspect-video bg-gray-800 rounded-2xl object-cover" />

      {/* Local video (PiP) */}
      <video ref={localRef} autoPlay playsInline muted
        className="absolute top-4 right-4 w-32 aspect-video bg-gray-700 rounded-xl object-cover border-2 border-white/20" />

      {/* Status */}
      <div className="mt-4 text-center space-y-1">
        {status === 'connecting' ? (
          <p className="text-gray-400 animate-pulse">Connecting to {role === 'customer' ? 'rider' : 'customer'}…</p>
        ) : (
          <p className="text-green-400 font-mono text-sm">{fmt(duration)}</p>
        )}
        <p className="text-xs text-gray-500">Order #{orderId} · Peer-to-peer encrypted call</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          {muted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button onClick={() => { endCall(); router.back(); }}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors">
          <PhoneOff size={26} />
        </button>
        <button onClick={toggleVideo}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${videoOff ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
          {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-600">No phone numbers shared · No Twilio minutes used</p>
    </div>
  );
}
