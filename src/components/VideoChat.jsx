import React from 'react';
import { useWebRTC } from '../hooks/useWebRTC';

function VideoChat() {
  const {
    yourSocketId,
    remoteSocketId,
    setRemoteSocketId,
    localVideoRef,
    remoteVideoRef,
    incomingCall,
    callUser,
    answerCall,
    rejectCall,
    endCall,
    callType,
    setCallType,
  } = useWebRTC();

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 800, margin: 'auto' }}>
      <h2>WebRTC Video Chat</h2>
      <p><strong>Your Socket ID:</strong> {yourSocketId || 'Connecting...'}</p>

      <div style={{ marginBottom: 15 }}>
        <label>
          <input
            type="radio"
            value="video"
            checked={callType === 'video'}
            onChange={() => setCallType('video')}
          /> Video Call
        </label>{' '}
        <label>
          <input
            type="radio"
            value="audio"
            checked={callType === 'audio'}
            onChange={() => setCallType('audio')}
          /> Audio Call
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <p><strong>Your Stream</strong></p>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', borderRadius: 8, background: '#000' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <p><strong>Remote Stream</strong></p>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: 8, background: '#000' }}
          />
        </div>
      </div>

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
          disabled={!remoteSocketId.trim()}
        >
          Call
        </button>
      </div>

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

      {(remoteSocketId && !incomingCall) && (
        <button
          onClick={endCall}
          style={{
            width: '100%',
            padding: 12,
            backgroundColor: '#ff4d4f',
            color: '#fff',
            fontSize: 16,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            marginTop: 10,
          }}
        >
          End Call
        </button>
      )}
    </div>
  );
}

export default VideoChat;
