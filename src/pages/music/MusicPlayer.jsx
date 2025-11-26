import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom' // Added useLocation
import './MusicPlayer.css'
import axios from 'axios'

export default function MusicPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation() // To access the passed state
  
  const [track, setTrack] = useState(null)
  const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const animationRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false) // Start paused to let audio load
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.9)
  const [playbackRate, setPlaybackRate] = useState(1)

  const formatTime = useCallback((s) => {
    if (!Number.isFinite(s)) return '0:00'
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }, [])

  // --- CHANGED: Load Data Strategy ---
  useEffect(() => {
    // 1. Check if data was passed via Router State (Instant Load)
    if (location.state?.trackData) {
        console.log("Using passed track data:", location.state.trackData);
        setTrack(location.state.trackData);
        return;
    }

    // 2. If no state (e.g. direct link), fetch from DB
    // NOTE: This will fail for Spotify IDs if user reloads page directly.
    // To fix that fully, you'd need a backend endpoint to fetch Spotify details by ID.
    // For now, this handles the DB case perfectly.
    console.log("Fetching track from DB...");
    axios.get(`${MUSIC_URL}/api/music/get-details/${id}`, { withCredentials: true })
      .then(res => {
        setTrack(res.data.music)
      })
      .catch(err => {
        console.error("Error loading track:", err)
        alert("Could not load track. It might be a Spotify preview that requires navigation from Home.");
        navigate('/'); 
      })
  }, [id, MUSIC_URL, location.state, navigate])


  // --- AUDIO HANDLERS ---
  
  function handleLoadedMetadata() {
    const d = audioRef.current?.duration
    if (d) setDuration(d)
    // Auto-play once loaded
    if(audioRef.current) {
        audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(e => console.log("Autoplay blocked:", e));
    }
  }

  function togglePlay() {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      cancelAnimationFrame(animationRef.current)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      animationRef.current = requestAnimationFrame(whilePlaying)
    }
  }

  function whilePlaying() {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
    animationRef.current = requestAnimationFrame(whilePlaying)
  }

  function handleProgressChange(e) {
    const val = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = val
      setCurrentTime(val)
    }
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

  // Cleanup animation frame
  useEffect(() => () => cancelAnimationFrame(animationRef.current), [])

  // Apply volume & playback rate
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate }, [playbackRate])

  // Update progress bar while playing
  useEffect(() => {
      if(isPlaying) {
          animationRef.current = requestAnimationFrame(whilePlaying);
      }
      return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying]);


  if(!track) {
    return <div style={{padding: '2rem', color: 'white'}}>Loading Player...</div>
  }
  
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
            {/* Show badge if Spotify */}
            {track.source === 'spotify' && <span style={{fontSize: '12px', color: '#1DB954', marginTop: '4px'}}>Spotify Preview (30s)</span>}
          </div>

          <audio
            ref={audioRef}
            src={track.musicUrl}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
                setIsPlaying(false)
                cancelAnimationFrame(animationRef.current)
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

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
                className="progress-bar"
              />
              <span className="time-total">{formatTime(duration)}</span>
            </div>
            <div className="buttons-row">
              <button type="button" className="btn btn-small" onClick={() => skip(-10)}>-10s</button>
              <button type="button" className="btn btn-primary" onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
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
        </div>
      </div>
    </div>
  )
}