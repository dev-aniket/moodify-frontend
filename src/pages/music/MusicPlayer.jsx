import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import './MusicPlayer.css'
import axios from 'axios'

export default function MusicPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [track, setTrack] = useState(null)
  const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const animationRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.9)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // New State: Determine if we should use the Embed Player
  const [useEmbed, setUseEmbed] = useState(false);

  const formatTime = useCallback((s) => {
    if (!Number.isFinite(s)) return '0:00'
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }, [])

  // 1. Load Data
  useEffect(() => {
    if (location.state?.trackData) {
        const t = location.state.trackData;
        setTrack(t);
        
        // CHECK: If it's Spotify and has no MP3, use Embed
        if (t.source === 'spotify' && !t.musicUrl) {
            setUseEmbed(true);
        } else {
            setUseEmbed(false);
        }
        return;
    }

    // Fallback: Fetch from DB (Only for local songs)
    axios.get(`${MUSIC_URL}/api/music/get-details/${id}`, { withCredentials: true })
      .then(res => {
        setTrack(res.data.music);
        setUseEmbed(false); // DB songs always have audio
      })
      .catch(err => {
        console.error(err)
        navigate('/'); 
      })
  }, [id, MUSIC_URL, location.state, navigate])


  // --- CUSTOM PLAYER LOGIC (Only runs if useEmbed is false) ---
  const safePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try { await audio.play(); setIsPlaying(true); } 
    catch (err) { if (err.name !== 'AbortError') console.error(err); }
  };

  const safePause = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
  };

  const togglePlay = () => { isPlaying ? safePause() : safePlay(); }

  function handleLoadedMetadata() {
    const d = audioRef.current?.duration
    if (d) setDuration(d)
    safePlay();
  }

  function whilePlaying() {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
    animationRef.current = requestAnimationFrame(whilePlaying)
  }

  function handleProgressChange(e) {
    const val = Number(e.target.value)
    if (audioRef.current) { audioRef.current.currentTime = val; setCurrentTime(val); }
  }

  function handleVolumeChange(e) {
    const val = Number(e.target.value)
    setVolume(val)
    if (audioRef.current) audioRef.current.volume = val
  }

  function handleRateChange(e) {
    const val = Number(e.target.value)
    setPlaybackRate(val)
    if (audioRef.current) audioRef.current.playbackRate = val
  }

  function skip(delta) {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(Math.max(0, audioRef.current.currentTime + delta), duration)
  }

  useEffect(() => {
      if(isPlaying) animationRef.current = requestAnimationFrame(whilePlaying);
      return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);


  if(!track) return <div className="loading-screen" style={{color:'white', padding:'20px'}}>Loading...</div>
  
  return (
    <div className="music-player-page stack" style={{ gap: 'var(--space-8)' }}>
      <header className="player-header">
        <button type="button" className="btn btn-small" onClick={() => navigate(-1)}>Back</button>
        <h1 className="player-title">{track.title}</h1>
      </header>

      <div className="player-layout">
        <div className="cover-pane">
          <img src={track.coverImageUrl} alt="Cover" className="player-cover" />
        </div>

        <div className="controls-pane surface">
          <div className="track-meta">
            <h2 className="track-name">{track.title}</h2>
            <p className="track-artist text-muted">{track.artist}</p>
          </div>

          {/* --- SWITCHER: EMBED VS CUSTOM PLAYER --- */}
          
          {useEmbed ? (
             // OPTION A: OFFICIAL SPOTIFY WIDGET
             <div className="spotify-embed-wrapper" style={{marginTop: '20px'}}>
                 <iframe 
                    style={{borderRadius: '12px'}} 
                    src={`https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0`} 
                    width="100%" 
                    height="152" 
                    frameBorder="0" 
                    allowFullScreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy">
                </iframe>
                <p style={{fontSize:'12px', color:'#888', marginTop:'10px', textAlign:'center'}}>
                    Playing via Spotify (Preview or Full if logged in)
                </p>
             </div>
          ) : (
             // OPTION B: YOUR CUSTOM PLAYER (For Local Songs)
             <>
                {track.musicUrl && (
                    <audio
                        ref={audioRef}
                        src={track.musicUrl}
                        preload="metadata"
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        onError={(e) => console.error("Audio Error:", e)}
                    />
                )}

                <div className="transport">
                    <div className="time-row">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <input
                        ref={progressRef}
                        type="range"
                        min={0}
                        max={duration || 0}
                        step={0.1}
                        value={currentTime}
                        onChange={handleProgressChange}
                        disabled={!track.musicUrl}
                        className="progress-bar"
                    />
                    <span className="time-total">{formatTime(duration)}</span>
                    </div>
                    <div className="buttons-row">
                    <button type="button" className="btn btn-small" onClick={() => skip(-10)}>-10s</button>
                    <button type="button" className="btn btn-primary" onClick={togglePlay} disabled={!track.musicUrl}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button type="button" className="btn btn-small" onClick={() => skip(10)}>+10s</button>
                    </div>
                </div>

                <div className="sliders">
                    <div className="slider-group">
                    <label htmlFor="volume" className="slider-label">Volume {Math.round(volume * 100)}%</label>
                    <input id="volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolumeChange} />
                    </div>
                    <div className="slider-group">
                    <label htmlFor="rate" className="slider-label">Speed {playbackRate}x</label>
                    <input id="rate" type="range" min={0.5} max={2} step={0.25} value={playbackRate} onChange={handleRateChange} />
                    </div>
                </div>
             </>
          )}

        </div>
      </div>
    </div>
  )
}