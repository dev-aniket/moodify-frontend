import React, { useEffect, useState, useRef } from 'react'
import './Home.css'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Home({ socket }) {
  const navigate = useNavigate();
  const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

  // Data State
  const [musics, setMusics] = useState([]) 
  const [moodSections, setMoodSections] = useState({ happy: [], sad: [], angry: [], neutral: [] }) 
  const [playlists, setPlaylists] = useState([])
  
  // UI State
  const [selectedFilter, setSelectedFilter] = useState('all'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(""); // Store the real name
  const [loadingMoods, setLoadingMoods] = useState(false);

  // Audio State
  const [playingPreview, setPlayingPreview] = useState(null); 
  const audioRef = useRef(new Audio()); 

  // 1. AUTH CHECK (The Fix)
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            setIsLoggedIn(true);
            // Get the first name from the stored user object
            if (user.fullname && user.fullname.firstName) {
                setUsername(user.fullname.firstName);
            } else {
                setUsername("User");
            }
        } catch (e) {
            console.error("Failed to parse user data", e);
            setIsLoggedIn(false);
        }
    }
  }, []);

  // 2. LOGOUT FUNCTION
  const handleLogout = () => {
      // Clear storage
      localStorage.removeItem('user');
      // Clear cookie (by calling backend logout endpoint if you have one, or just client side clearing)
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setIsLoggedIn(false);
      navigate('/login');
  }

  // 3. Fetch Data
  useEffect(() => {
    // Fetch Local DB Music
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

    // Fetch Playlists
    axios.get(`${MUSIC_URL}/api/music/playlists`, { withCredentials: true })
      .then(res => {
        setPlaylists(res.data.playlists.map(p => ({
          id: p._id,
          title: p.title,
          count: p.musics.length
        })))
      })
      .catch(err => console.error("Error fetching playlists:", err));

    // Fetch Spotify Moods
    setLoadingMoods(true);
    axios.get(`${MUSIC_URL}/api/music/spotify/home`, { withCredentials: true })
        .then(res => {
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
  }, [MUSIC_URL]);


  const handleCardClick = (m) => {
    if (audioRef.current) {
        audioRef.current.pause();
        setPlayingPreview(null);
    }
    socket?.emit("play", { musicId: m.id });
    navigate(`/music/${m.id}`, { state: { trackData: m } });
  };

  const handlePlaylistClick = (playlistId) => {
      navigate(`/playlist/${playlistId}`);
  }

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
              className="music-card surface"
              tabIndex={0}
            >
              <div className="music-cover-wrap">
                <img src={m.coverImageUrl} alt="" className="music-cover" />
                {m.source === 'spotify' && (
                    <div style={{
                        position: 'absolute', top: '5px', right: '5px', 
                        background: 'rgba(0,0,0,0.6)', borderRadius:'50%', padding:'4px'
                    }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" alt="Spotify" width="16" />
                    </div>
                )}
              </div>
              <div className="music-info">
                <h3 className="music-title" title={m.title}>{m.title}</h3>
                <p className="music-artist text-muted" title={m.artist}>{m.artist}</p>
                {m.source === 'spotify' && <span style={{fontSize: '10px', color: '#1DB954'}}>Spotify</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  };

  return (
    <div className="home-page stack">
      
      <nav className="home-navbar surface">
        <div className="nav-left">
            <Link to="/" style={{textDecoration:'none', color:'inherit'}}>
                <h1 className="nav-logo" style={{cursor:'pointer'}}>Moodify</h1>
            </Link>
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
                // ✅ IF LOGGED IN: Show Name + Dashboard + Logout
                <div className="nav-user">
                    <span className="user-greeting" style={{marginRight:'10px', fontWeight:'bold'}}>Hi, {username}</span>
                    <button onClick={() => navigate('/artist/dashboard')} className="btn btn-small">Dashboard</button>
                    <button onClick={handleLogout} className="btn btn-small" style={{marginLeft:'10px', background:'transparent', border:'1px solid #444'}}>Logout</button>
                </div>
            ) : (
                // ❌ IF NOT LOGGED IN: Show Login/Register
                <div className="nav-actions">
                    <Link to="/login" className="btn btn-ghost">Login</Link>
                    <Link to="/register" className="btn btn-primary">Register</Link>
                </div>
            )}
        </div>
      </nav>

      {/* ... Content Section remains the same ... */}
      <div className="home-content stack" style={{ gap: 'var(--space-8)' }}>
        
        {/* Playlists */}
        {selectedFilter === 'all' && (
            <section className="home-section">
                <div className="section-head">
                    <h2 className="section-title">Trending Playlists</h2>
                </div>
                <div className="playlist-grid">
                    {playlists.map(p => (
                    <div key={p.id} className="playlist-card surface" tabIndex={0} onClick={() => handlePlaylistClick(p.id)}>
                        <div className="playlist-info">
                        <h3 className="playlist-title" title={p.title}>{p.title}</h3>
                        <p className="playlist-meta text-muted">{p.count} tracks</p>
                        </div>
                    </div>
                    ))}
                </div>
            </section>
        )}

        {/* Combined Sections */}
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