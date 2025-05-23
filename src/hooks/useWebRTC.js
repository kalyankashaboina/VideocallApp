import { useEffect, useRef, useState } from 'react';
import socket from '../socket';  // Make sure socket is properly exported in your socket.js

export const useWebRTC = (defaultCallType = 'video') => {
  const [yourSocketId, setYourSocketId] = useState('');
  const [remoteSocketId, setRemoteSocketId] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState(defaultCallType);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);
  const peerConnection = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected:', socket.id);
      setYourSocketId(socket.id);
    });

    socket.on('call-made', (data) => setIncomingCall(data));

    socket.on('answer-made', async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(candidate);
        } catch (err) {
          console.error('ICE candidate error', err);
        }
      }
    });

    // Handle call end notification
    socket.on('leave-call', () => {
      console.log('Call ended by remote');
      endCall(false);
    });

    return () => {
      socket.off('connect');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
      socket.off('leave-call');
    };
  }, []);

  const getMedia = async (type) => {
    const constraints = type === 'video' ? { video: true, audio: true } : { video: false, audio: true };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Media error:', err);
      alert('Camera/Mic access needed');
    }
  };

  useEffect(() => {
    getMedia(callType);
  }, [callType]);

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: remoteSocketId || incomingCall?.socket,
        });
      }
    };

    return pc;
  };

  const callUser = async () => {
    if (!streamRef.current || !remoteSocketId.trim()) return;

    peerConnection.current = createPeerConnection(streamRef.current);
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit('call-user', {
      offer,
      to: remoteSocketId.trim(),
      type: callType,
    });
  };

  const answerCall = async () => {
    if (!incomingCall) return;

    const mediaType = incomingCall.type || 'video';
    setCallType(mediaType);
    await getMedia(mediaType);

    peerConnection.current = createPeerConnection(streamRef.current);
    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit('make-answer', {
      answer,
      to: incomingCall.socket,
    });

    setRemoteSocketId(incomingCall.socket);
    setIncomingCall(null);
  };

  const endCall = (notify = true) => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (notify && remoteSocketId) {
      socket.emit('leave-call', { to: remoteSocketId });
    }

    setRemoteSocketId('');
    setIncomingCall(null);
  };

  return {
    yourSocketId,
    remoteSocketId,
    setRemoteSocketId,
    localVideoRef,
    remoteVideoRef,
    incomingCall,
    callUser,
    answerCall,
    rejectCall: () => setIncomingCall(null),
    endCall,
    callType,
    setCallType,
  };
};
