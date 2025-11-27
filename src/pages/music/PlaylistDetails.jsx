import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './MusicPlayer.css' // Re-using player styles for consistency

export default function PlaylistDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [playlist, setPlaylist] = useState(null)
    const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

    useEffect(() => {
        axios.get(`${MUSIC_URL}/api/music/playlist/${id}`, { withCredentials: true })
            .then(res => setPlaylist(res.data.playlist))
            .catch(err => console.error(err))
    }, [id])

    if (!playlist) return <div style={{color:'white', padding:'20px'}}>Loading Playlist...</div>

    return (
        <div className="stack" style={{ gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
            <header style={{display:'flex', alignItems:'center', gap:'20px'}}>
                <button className="btn btn-small" onClick={() => navigate(-1)}>Back</button>
                <div>
                    <h1 style={{fontSize:'2rem', margin:0}}>{playlist.title}</h1>
                    <p className="text-muted">Created by {playlist.artist}</p>
                </div>
            </header>

            <div className="music-grid">
                {playlist.musics.map(m => (
                    <div 
                        key={m._id} 
                        className="music-card surface"
                        onClick={() => navigate(`/music/${m._id}`, { state: { trackData: m } })}
                    >
                        <div className="music-cover-wrap">
                            <img src={m.coverImageUrl} alt={m.title} className="music-cover" />
                        </div>
                        <div className="music-info">
                            <h3 className="music-title">{m.title}</h3>
                            <p className="music-artist text-muted">{m.artist}</p>
                        </div>
                    </div>
                ))}
            </div>
            {playlist.musics.length === 0 && <p className="text-muted">No songs in this playlist yet.</p>}
        </div>
    )
}