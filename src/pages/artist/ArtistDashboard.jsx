import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ArtistDashboard.css'
import axios from 'axios'

export default function ArtistDashboard() {

    const navigate = useNavigate();
    
    // Unified music objects (could be fetched later)
    const [ musics, setMusics ] = useState([
        { id: 'm1', title: 'Midnight Echoes', artist: 'You', coverImageUrl: 'https://via.placeholder.com/56?text=M1', musicUrl: '#', plays: 12450, duration: '3:42', released: '2024-11-10' },
        { id: 'm2', title: 'Golden Skies', artist: 'You', coverImageUrl: 'https://via.placeholder.com/56?text=M2', musicUrl: '#', plays: 9803, duration: '4:05', released: '2025-01-02' },
        { id: 'm3', title: 'Fading Lights', artist: 'You', coverImageUrl: 'https://via.placeholder.com/56?text=M3', musicUrl: '#', plays: 15221, duration: '2:58', released: '2024-09-28' },
        { id: 'm4', title: 'Ocean Drift', artist: 'You', coverImageUrl: 'https://via.placeholder.com/56?text=M4', musicUrl: '#', plays: 4311, duration: '3:15', released: '2025-02-14' },
        { id: 'm5', title: 'Solstice', artist: 'You', coverImageUrl: 'https://via.placeholder.com/56?text=M5', musicUrl: '#', plays: 8765, duration: '3:05', released: '2025-03-01' },
    ]);

    // Playlists referencing subset of musics
    const [ playlists, setPlaylists ] = useState(
        [
            {
                id: 'p1',
                title: 'Chill Vibes',
                artist: 'You',
                followers: 3200,
                updated: '2d ago',
                musics: [ 'm1', 'm3', 'm4' ]
            },
            {
                id: 'p2',
                title: 'Focus Beats',
                artist: 'You',
                followers: 5120,
                updated: '5d ago',
                musics: [ 'm2', 'm5', 'm3' ]
            },
            {
                id: 'p3',
                title: 'Acoustic Session',
                artist: 'You',
                followers: 1780,
                updated: '1d ago',
                musics: [ 'm4', 'm1' ]
            }
        ]
    )

    useEffect(() => {

        axios.get("http://localhost:3002/api/music/artist-musics", {
            withCredentials: true
        })
            .then(res => {
                setMusics(res.data.musics.map(m => ({
                    id: m._id,
                    title: m.title,
                    artist: m.artist,
                    coverImageUrl: m.coverImageUrl,
                    musicUrl: m.musicUrl,
                    plays: m.plays || 0,
                    duration: m.duration || '3:00',
                    released: m.released ? new Date(m.released).toISOString().split('T')[ 0 ] : '2024-01-01'
                })));
            })

        axios.get("http://localhost:3002/api/music/playlist/artist", { withCredentials: true })
            .then(res => {
                setPlaylists(res.data.playlists.map(p => ({
                    id: p._id,
                    title: p.title,
                    artist: p.artist,
                    followers: p.followers || 0,
                    updated: p.updated ? `${Math.floor((Date.now() - new Date(p.updated).getTime()) / (1000 * 60 * 60 * 24))}d ago` : 'N/A',
                    musics: p.musics || []
                })));
            })


    },[])

    const musicMap = Object.fromEntries(musics.map(m => [ m.id, m ]))

    return (
        <div className="artist-dashboard stack" style={{ gap: 'var(--space-8)' }}>
            <header className="dashboard-header">
                <div>
                    <h1 className="dash-title">Artist Dashboard</h1>
                    <p className="text-muted dash-sub">Overview of your content performance</p>
                </div>
                <div className="dashboard-actions inline">
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/artist/dashboard/upload-music')}>+ New Track</button>
                    <button type="button" className="btn" style={{ background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)' }}>+ New Playlist</button>
                </div>
            </header>

            <section className="data-panels">
                <div className="panel surface">
                    <h3 className="panel-title">Total Plays</h3>
                    <p className="metric">{musics.reduce((a, t) => a + (t.plays || 0), 0).toLocaleString()}</p>
                </div>
                <div className="panel surface">
                    <h3 className="panel-title">Musics</h3>
                    <p className="metric">{musics.length}</p>
                </div>
                <div className="panel surface">
                    <h3 className="panel-title">Playlists</h3>
                    <p className="metric">{playlists.length}</p>
                </div>
                <div className="panel surface">
                    <h3 className="panel-title">Followers</h3>
                    <p className="metric">{playlists.reduce((a, p) => a + (p.followers || 0), 0).toLocaleString()}</p>
                </div>
            </section>

            <div className="grid-sections">
                <section className="tracks-section surface">
                    <div className="section-head">
                        <h2 className="section-title">Musics</h2>
                        <button type="button" className="btn btn-small">Manage</button>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>Title</th>
                                    <th>Artist</th>
                                    <th>Plays</th>
                                    <th>Duration</th>
                                    <th>Released</th>
                                </tr>
                            </thead>
                            <tbody>
                                {musics.map(m => (
                                    <tr key={m.id}>
                                        <td className="title-cell">
                                            <div className="music-cell">
                                                <img src={m.coverImageUrl} alt="" className="music-cover" />
                                                <div className="music-meta">
                                                    <span className="music-title">{m.title}</span>
                                                    <span className="music-artist text-muted">{m.artist}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{m.artist}</td>
                                        <td>{m.plays.toLocaleString()}</td>
                                        <td>{m.duration}</td>
                                        <td>{m.released}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="playlists-section surface">
                    <div className="section-head">
                        <h2 className="section-title">Playlists</h2>
                        <button type="button" className="btn btn-small">View All</button>
                    </div>
                    <ul className="playlist-list">
                        {playlists.map(p => {
                            const resolvedMusics = p.musics.map(id => musicMap[ id ]).filter(Boolean)
                            return (
                                <li key={p.id} className="playlist-item">
                                    <div className="playlist-top">
                                        <div className="playlist-cover-collage" aria-hidden>
                                            {resolvedMusics.slice(0, 4).map(m => (
                                                <img key={m.id} src={m.coverImageUrl} alt="" />
                                            ))}
                                        </div>
                                        <div className="playlist-meta">
                                            <span className="playlist-name">{p.title}</span>
                                            <span className="playlist-updated text-muted">Updated {p.updated}</span>
                                        </div>
                                    </div>
                                    <div className="playlist-stats">
                                        <span>{resolvedMusics.length} musics</span>
                                        <span>{p.followers.toLocaleString()} followers</span>
                                    </div>
                                    <div className="playlist-music-thumbs">
                                        {resolvedMusics.slice(0, 6).map(m => (
                                            <div key={m.id} className="music-thumb" title={m.title}>
                                                <img src={m.coverImageUrl} alt="" />
                                                <span className="music-thumb-title">{m.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            </div>
        </div>
    )
}