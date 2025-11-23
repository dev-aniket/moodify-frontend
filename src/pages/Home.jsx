import React, { useEffect, useState } from 'react'
import './Home.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Home({ socket }) {
  const navigate = useNavigate();

  // Sample data; later can be replaced by API calls
  const [ musics, setMusics ] = useState(
    [
      { id: 'm1', title: 'Midnight Echoes', artist: 'Alex Wave', coverImageUrl: 'https://via.placeholder.com/300?text=M1' },
      { id: 'm2', title: 'Golden Skies', artist: 'Luna Sun', coverImageUrl: 'https://via.placeholder.com/300?text=M2' },
      { id: 'm3', title: 'Fading Lights', artist: 'Neon Drift', coverImageUrl: 'https://via.placeholder.com/300?text=M3' },
      { id: 'm4', title: 'Ocean Drift', artist: 'Deep Current', coverImageUrl: 'https://via.placeholder.com/300?text=M4' },
      { id: 'm5', title: 'Solstice', artist: 'Alex Wave', coverImageUrl: 'https://via.placeholder.com/300?text=M5' },
      { id: 'm6', title: 'Night Sparks', artist: 'Luna Sun', coverImageUrl: 'https://via.placeholder.com/300?text=M6' },
    ]
  )

  const [ playlists, setPlaylists ] = useState([
    { id: 'p1', title: 'Chill Vibes', count: 32 },
    { id: 'p2', title: 'Focus Beats', count: 24 },
    { id: 'p3', title: 'Acoustic', count: 18 },
    { id: 'p4', title: 'Late Night', count: 15 },
  ])

  useEffect(() => {
    axios.get("http://localhost:3002/api/music", { withCredentials: true })
      .then(res => {
        setMusics(res.data.musics.map(m => ({
          id: m._id,
          title: m.title,
          artist: m.artist,
          coverImageUrl: m.coverImageUrl,
          musicUrl: m.musicUrl,
        })))
      })

    axios.get("http://localhost:3002/api/music/playlists", { withCredentials: true })
      .then(res => {
        setPlaylists(res.data.playlists.map(p => ({
          id: p._id,
          title: p.title,
          count: p.musics.length
        })))
      })

  }, [])

  return (
    <div className="home-page stack" style={{ gap: 'var(--space-8)' }}>
      <header className="home-hero">
        <h1 className="home-title">Discover</h1>
        <p className="text-muted home-tag">Trending playlists and new releases</p>
      </header>

      <section className="home-section">
        <div className="section-head">
          <h2 className="section-title">Playlists</h2>
          <button className="btn btn-small" type="button">View All</button>
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

      <section className="home-section">
        <div className="section-head">
          <h2 className="section-title">Musics</h2>
          <button className="btn btn-small" type="button">Explore</button>
        </div>
        <div className="music-grid">
          {musics.map(m => (
            <div
              onClick={() => {
                socket?.emit("play", { musicId: m.id })
                navigate(`/music/${m.id}`)
              }}
              key={m.id} className="music-card surface" tabIndex={0}>
              <div className="music-cover-wrap">
                <img src={m.coverImageUrl} alt="" className="music-cover" />
              </div>
              <div className="music-info">
                <h3 className="music-title" title={m.title}>{m.title}</h3>
                <p className="music-artist text-muted" title={m.artist}>{m.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
