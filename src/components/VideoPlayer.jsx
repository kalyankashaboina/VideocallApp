// components/VideoPlayer.js
import React from 'react';

const VideoPlayer = ({ title, videoRef, muted = false }) => (
  <div style={{ flex: 1 }}>
    <p><strong>{title}</strong></p>
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      style={{ width: '100%', borderRadius: 8, background: '#000' }}
    />
  </div>
);

export default VideoPlayer;
