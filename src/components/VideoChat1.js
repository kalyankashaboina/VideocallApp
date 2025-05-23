import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function VideoChat() {
  const [yourSocketId, setYourSocketId] = useState('');
  const [remoteSocketId, setRemoteSocketId] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [callType, setCallType] = useState('video'); // 'video' or 'audio'
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerConnection = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => {
      setYourSocketId(socket.id);
    });

    socket.on('call-made', (data) => {
      setIncomingCall(data);
    });

    socket.on('answer-made', async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        try {
          await peerConnection.current.addIceCandidate(candidate);
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('call-made');
      socket.off('answer-made');
      socket.off('ice-candidate');
    };
  }, []);

  const getMedia = async (type) => {
    const constraints = type === 'video'
      ? { video: true, audio: true }
      : { video: false, audio: true };

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
    getMedia(callType); // default media on mount or toggle
  }, [callType]);

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
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

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(incomingCall.offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.emit('make-answer', {
      answer,
      to: incomingCall.socket,
    });

    setRemoteSocketId(incomingCall.socket);
    setIncomingCall(null);
  };

  const rejectCall = () => {
    setIncomingCall(null);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 800, margin: 'auto' }}>
      <h2>WebRTC Video Chat</h2>
      <p><strong>Your Socket ID:</strong> {yourSocketId || 'Connecting...'}</p>

      {/* Media Type Selector */}
      <div style={{ marginBottom: 15 }}>
        <label>
          <input
            type="radio"
            value="video"
            checked={callType === 'video'}
            onChange={() => setCallType('video')}
          /> Video Call
        </label>
        {' '}
        <label>
          <input
            type="radio"
            value="audio"
            checked={callType === 'audio'}
            onChange={() => setCallType('audio')}
          /> Audio Call
        </label>
      </div>

      {/* Video Panels */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <p><strong>Your Stream</strong></p>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 8, background: '#000' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p><strong>Remote Stream</strong></p>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, background: '#000' }} />
        </div>
      </div>

      {/* Call Controls */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter remote socket ID"
          value={remoteSocketId}
          onChange={(e) => setRemoteSocketId(e.target.value)}
          style={{ width: '70%', padding: 10, fontSize: 16, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
          onClick={callUser}
          style={{
            width: '28%',
            marginLeft: '2%',
            padding: 12,
            backgroundColor: '#007bff',
            color: '#fff',
            fontSize: 16,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Call
        </button>
      </div>

      {/* Incoming Call UI */}
      {incomingCall && (
        <div style={{ padding: 15, background: '#f0f0f0', borderRadius: 8 }}>
          <p style={{ fontSize: 18 }}>
            📞 Incoming {incomingCall.type || 'video'} call from: <strong>{incomingCall.socket}</strong>
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={answerCall}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#28a745',
                color: '#fff',
                fontSize: 16,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Accept
            </button>
            <button
              onClick={rejectCall}
              style={{
                flex: 1,
                padding: 12,
                backgroundColor: '#dc3545',
                color: '#fff',
                fontSize: 16,
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoChat;
