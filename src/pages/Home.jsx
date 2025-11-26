import React, { useEffect, useState, useRef } from 'react'
import './Home.css'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Home({ socket }) {
  const navigate = useNavigate();
  const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

  // Data State
  const [musics, setMusics] = useState([]) // Local DB music
  const [moodSections, setMoodSections] = useState({ happy: [], sad: [], angry: [], neutral: [] }) // Spotify Music
  const [playlists, setPlaylists] = useState([])
  
  // UI State
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingMoods, setLoadingMoods] = useState(false);

  // Audio State for Previews
  const [playingPreview, setPlayingPreview] = useState(null); // ID of currently playing track
  const audioRef = useRef(new Audio()); // Hidden audio element

  // 1. Auth Check
  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token='));
    if (token) setIsLoggedIn(true);
  }, []);

  // 2. Fetch Data
  useEffect(() => {
    // 2a. Fetch Local DB Music
    axios.get(`${MUSIC_URL}/api/music`, { withCredentials: true })
      .then(res => {
        setMusics(res.data.musics.map(m => ({
          id: m._id,
          title: m.title,
          artist: m.artist,
          coverImageUrl: m.coverImageUrl,
          musicUrl: m.musicUrl,
          mood: m.mood || 'neutral',
          source: 'db'
        })))
      })
      .catch(err => console.error("Error fetching music:", err));

    // 2b. Fetch Playlists
    axios.get(`${MUSIC_URL}/api/music/playlists`, { withCredentials: true })
      .then(res => {
        setPlaylists(res.data.playlists.map(p => ({
          id: p._id,
          title: p.title,
          count: p.musics.length
        })))
      })
      .catch(err => console.error("Error fetching playlists:", err));

    // 2c. Fetch Spotify Moods
    setLoadingMoods(true);
    axios.get(`${MUSIC_URL}/api/music/spotify/home`, { withCredentials: true })
        .then(res => {
            console.log("📦 FRONTEND RECEIVED SPOTIFY DATA:", res.data); // <--- LOOK FOR THIS IN CHROME CONSOLE
            setMoodSections({
                happy: res.data.happy,
                sad: res.data.sad,
                angry: res.data.angry,
                neutral: res.data.neutral
            });
            setLoadingMoods(false);
        })
        .catch(err => {
            console.error("Error fetching spotify moods:", err);
            setLoadingMoods(false);
        });
  }, []);

  // 3. Playback Logic
  const handleCardClick = (m) => {
    // Case A: Local DB Music -> Go to full player
    if (m.source === 'db') {
        // Stop any preview if running
        audioRef.current.pause(); 
        setPlayingPreview(null);
        
        socket?.emit("play", { musicId: m.id });
        navigate(`/music/${m.id}`);
        return;
    }

    // Case B: Spotify Preview
    if (m.source === 'spotify') {
        if (playingPreview === m.id) {
            // Pause if already playing
            audioRef.current.pause();
            setPlayingPreview(null);
        } else {
            // Play new track
            audioRef.current.src = m.musicUrl;
            audioRef.current.play();
            setPlayingPreview(m.id);
        }
    }
  };

  // Reusable Section Component
  const MusicSection = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="home-section">
        <div className="section-head">
          <h2 className="section-title">{title}</h2>
        </div>
        <div className="music-grid">
          {items.map(m => (
            <div
              onClick={() => handleCardClick(m)}
              key={m.id} 
              className={`music-card surface ${playingPreview === m.id ? 'is-playing' : ''}`} 
              tabIndex={0}
              style={{ borderColor: playingPreview === m.id ? 'var(--color-primary)' : '' }}
            >
              <div className="music-cover-wrap">
                <img src={m.coverImageUrl} alt="" className="music-cover" />
                {/* Overlay Icon for Spotify Tracks */}
                {m.source === 'spotify' && (
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: playingPreview === m.id ? 1 : 0, transition: 'opacity 0.2s'
                    }} className="play-overlay">
                        <span style={{ fontSize: '24px' }}>{playingPreview === m.id ? '⏸' : '▶'}</span>
                    </div>
                )}
              </div>
              <div className="music-info">
                <h3 className="music-title" title={m.title}>{m.title}</h3>
                <p className="music-artist text-muted" title={m.artist}>{m.artist}</p>
                {m.source === 'spotify' && <span style={{fontSize: '10px', color: '#1DB954'}}>Spotify Preview</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  };

  return (
    <div className="home-page stack">
      
      {/* --- NAVBAR --- */}
      <nav className="home-navbar surface">
        <div className="nav-left">
            <h1 className="nav-logo">Moodify</h1>
        </div>

        <div className="nav-center">
            <select className="mood-select" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
                <option value="all">Select Mood (All)</option>
                <option value="happy">Happy</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="neutral">Neutral</option>
            </select>
        </div>

        <div className="nav-right">
            {isLoggedIn ? (
                <div className="nav-user">
                    <span className="user-greeting">Hi, User</span>
                    <button onClick={() => navigate('/artist/dashboard')} className="btn btn-small">Dashboard</button>
                </div>
            ) : (
                <div className="nav-actions">
                    <Link to="/login" className="btn btn-ghost">Login</Link>
                    <Link to="/register" className="btn btn-primary">Register</Link>
                </div>
            )}
        </div>
      </nav>

      {/* --- CONTENT --- */}
      <div className="home-content stack" style={{ gap: 'var(--space-8)' }}>
        
        {/* Playlists */}
        {selectedFilter === 'all' && (
            <section className="home-section">
                <div className="section-head">
                    <h2 className="section-title">Trending Playlists</h2>
                </div>
                <div className="playlist-grid">
                    {playlists.map(p => (
                    <div key={p.id} className="playlist-card surface" tabIndex={0}>
                        <div className="playlist-info">
                        <h3 className="playlist-title" title={p.title}>{p.title}</h3>
                        <p className="playlist-meta text-muted">{p.count} tracks</p>
                        </div>
                    </div>
                    ))}
                </div>
            </section>
        )}

        {/* Combined Sections (Local + Spotify) */}
        
        {(selectedFilter === 'all' || selectedFilter === 'neutral') && 
            <>
                <MusicSection title="Neutral Vibes (Community)" items={musics.filter(m => m.mood === 'neutral')} />
                <MusicSection title="Neutral / Chill (Spotify)" items={moodSections.neutral} />
            </>
        }
        
        {(selectedFilter === 'all' || selectedFilter === 'happy') && 
            <>
                <MusicSection title="Happy Hits (Community)" items={musics.filter(m => m.mood === 'happy')} />
                <MusicSection title="Happy Hits (Spotify)" items={moodSections.happy} />
            </>
        }

        {(selectedFilter === 'all' || selectedFilter === 'sad') && 
             <>
                <MusicSection title="Melancholy Moments (Community)" items={musics.filter(m => m.mood === 'sad')} />
                <MusicSection title="Melancholy Moments (Spotify)" items={moodSections.sad} />
            </>
        }

        {(selectedFilter === 'all' || selectedFilter === 'angry') && 
             <>
                <MusicSection title="High Energy (Community)" items={musics.filter(m => m.mood === 'angry')} />
                <MusicSection title="High Energy (Spotify)" items={moodSections.angry} />
            </>
        }
        
        {loadingMoods && <p style={{textAlign:'center', color: '#888'}}>Loading Spotify Suggestions...</p>}
      </div>
    </div>
  )
}