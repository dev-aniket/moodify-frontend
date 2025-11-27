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
  const [error, setError] = useState(null)
  
  // Playlist State
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  
  // Logic State
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

    axios.get(`${MUSIC_URL}/api/music/get-details/${id}`, { withCredentials: true })
      .then(res => {
        setTrack(res.data.music);
        setUseEmbed(false); 
      })
      .catch(err => {
        console.error(err)
        navigate('/'); 
      })
  }, [id, MUSIC_URL, location.state, navigate])


  // 2. Playlist Logic (UPDATED)
  const handleAddToPlaylist = async () => {
      if(!newPlaylistName) return alert("Please enter a name");
      
      try {
          // We now send the FULL track object, so the backend can save Spotify details directly
          await axios.post(`${MUSIC_URL}/api/music/playlist`, {
              title: newPlaylistName,
              songs: [track] // Send the whole track object, not just ID
          }, { withCredentials: true });
          
          alert("Playlist created!");
          setShowPlaylistModal(false);
          setNewPlaylistName("");
      } catch (err) {
          console.error(err);
          alert("Failed to create playlist.");
      }
  }


  // 3. Audio Handlers
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

          {/* --- ADD TO PLAYLIST BUTTON (NOW VISIBLE FOR ALL) --- */}
          <div style={{marginBottom: '15px', display:'flex', justifyContent:'center'}}>
                 <button className="btn btn-small" onClick={() => setShowPlaylistModal(true)}>
                     + Add to Playlist
                 </button>
          </div>

          {/* --- SWITCHER --- */}
          {useEmbed ? (
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
                
                {/* ERROR MESSAGE UI */}
                {error && (
                    <div style={{marginTop: '10px', textAlign:'center'}}>
                        <p style={{color: '#ff4d4d', fontSize:'12px', marginBottom: '5px'}}>{error}</p>
                        {track.externalUrl && (
                            <a 
                                href={track.externalUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-small"
                                style={{background: '#1DB954', color: 'white', textDecoration: 'none', display: 'inline-block', fontSize:'12px'}}
                            >
                                Open in Spotify App
                            </a>
                        )}
                    </div>
                )}
             </div>
          ) : (
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

          {/* --- PLAYLIST MODAL --- */}
          {showPlaylistModal && (
              <div className="modal-overlay" style={{
                  position:'fixed', top:0, left:0, right:0, bottom:0, 
                  background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000
              }}>
                  <div className="modal-content surface" style={{padding:'24px', borderRadius:'12px', width:'320px', border:'1px solid var(--color-border)'}}>
                      <h3 style={{marginTop:0}}>Create New Playlist</h3>
                      <p style={{fontSize:'14px', color:'#ccc'}}>Add <strong>{track.title}</strong> to:</p>
                      
                      <input 
                          type="text" 
                          placeholder="My Awesome Playlist" 
                          value={newPlaylistName}
                          onChange={e => setNewPlaylistName(e.target.value)}
                          style={{
                              width:'100%', padding:'12px', marginTop:'10px', marginBottom:'20px', 
                              borderRadius:'8px', border:'1px solid var(--color-border)', 
                              background:'var(--color-surface-alt)', color:'white'
                          }}
                      />
                      
                      <div style={{display:'flex', gap:'10px', justifyContent:'flex-end'}}>
                          <button className="btn btn-small" onClick={() => setShowPlaylistModal(false)}>Cancel</button>
                          <button className="btn btn-primary" onClick={handleAddToPlaylist}>Create Playlist</button>
                      </div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  )
}