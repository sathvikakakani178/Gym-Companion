import { useState } from 'react';
import VideoTemplate from "@/components/video/VideoTemplate";

export default function App() {
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    window.speechSynthesis.cancel();
    const warmup = new SpeechSynthesisUtterance(' ');
    warmup.volume = 0;
    window.speechSynthesis.speak(warmup);
    setStarted(true);
  };

  if (!started) {
    return (
      <div
        onClick={handleStart}
        style={{
          width: '100%',
          height: '100vh',
          background: '#0D0F14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'rgba(46,204,113,0.15)',
          border: '2px solid #2ECC71',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 0 60px rgba(46,204,113,0.3)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#2ECC71">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div style={{ color: '#F0F4FF', fontSize: '1.6rem', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
          Click to Play
        </div>
        <div style={{ color: '#8A94A6', fontSize: '1rem' }}>
          GymLeads Demo · Voiceover Enabled
        </div>
      </div>
    );
  }

  return <VideoTemplate />;
}
