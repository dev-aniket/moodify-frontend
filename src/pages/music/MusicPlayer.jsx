import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './MusicPlayer.css'
import axios from 'axios'



export default function MusicPlayer() {
  const { id } = useParams()
  const navigate = useNavigate()
    const [track, setTrack] = useState(null)

  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const animationRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.9)
  const [playbackRate, setPlaybackRate] = useState(1)

  // Format time helper
  const formatTime = useCallback((s) => {
    if (!Number.isFinite(s)) return '0:00'
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }, [])

  // Load metadata
  function handleLoadedMetadata() {
    const d = audioRef.current?.duration
    if (d) setDuration(d)
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

  // Apply volume & playback rate w0hen component mounts or changes
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume }, [volume])
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = playbackRate }, [playbackRate])

  // Auto navigate if invalid id
  useEffect(() => {
    axios.get(`http://localhost:3002/api/music/get-details/${id}`, {withCredentials: true})
      .then(res => {
        setTrack(res.data.music)
      })
      .catch(err => {
        console.error(err)
        // navigate('/')
      })
  }, [])


  if(!track) {
    // Fetch track details from backend
    return <div>Loading...</div>
    
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
          </div>

          <audio
            ref={audioRef}
            src={track.musicUrl}
            preload="metadata"
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            autoPlay={true}
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