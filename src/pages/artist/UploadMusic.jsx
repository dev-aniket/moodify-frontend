import React, { useState, useEffect, useRef } from 'react'
import './UploadMusic.css'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function UploadMusic() {

    const navigate = useNavigate();
    const MUSIC_URL = import.meta.env.VITE_MUSIC_URL || 'http://localhost:3002';

    const [ form, setForm ] = useState({
        title: '',
        mood: 'neutral', // Default mood
        coverImage: null,
        music: null,
    })

    const [ coverPreview, setCoverPreview ] = useState(null)
    const [ musicPreview, setMusicPreview ] = useState(null)
    const [ musicDuration, setMusicDuration ] = useState(null)
    const audioRef = useRef(null)

    useEffect(() => {
        if (form.coverImage) {
            const url = URL.createObjectURL(form.coverImage)
            setCoverPreview(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setCoverPreview(null)
        }
    }, [ form.coverImage ])

    useEffect(() => {
        if (form.music) {
            const url = URL.createObjectURL(form.music)
            setMusicPreview(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setMusicPreview(null)
            setMusicDuration(null)
        }
    }, [ form.music ])

    function handleAudioLoaded() {
        if (audioRef.current?.duration) {
            const d = audioRef.current.duration
            const mins = Math.floor(d / 60)
            const secs = Math.round(d % 60).toString().padStart(2, '0')
            setMusicDuration(`${mins}:${secs}`)
        }
    }

    function handleChange(e) {
        const { name, files, value, type } = e.target
        setForm(f => ({ ...f, [ name ]: type === 'file' ? (files?.[ 0 ] || null) : value }))
    }

    function removeFile(kind) {
        setForm(f => ({ ...f, [ kind ]: null }))
    }

    function handleSubmit(e) {
        e.preventDefault()

        const formData = new FormData()
        formData.append('title', form.title)
        formData.append('mood', form.mood) // Send mood to backend
        
        if (form.coverImage) formData.append('coverImage', form.coverImage)
        if (form.music) formData.append('music', form.music)

        axios.post(`${MUSIC_URL}/api/music/upload`, formData, {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" } 
        })
            .then(() => {
                navigate('/artist/dashboard');
             })
            .catch((err) => {
                console.error("Upload failed:", err);
                alert("Upload failed. Check console for details.");
            });
    }

    return (
        <div className="upload-music-page stack" style={{ gap: 'var(--space-6)' }}>
            <header className="upload-header">
                <h1 className="upload-title">Upload Music</h1>
                <p className="text-muted upload-sub">Add a new track to your catalog</p>
            </header>

            <form className="upload-form surface" onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                    <div className="field-group">
                        <label htmlFor="title">Title</label>
                        <input
                            id="title"
                            name="title"
                            type="text"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="Song title"
                        />
                    </div>

                    {/* --- NEW MOOD SELECTOR --- */}
                    <div className="field-group">
                        <label htmlFor="mood">Mood</label>
                        <select
                            id="mood"
                            name="mood"
                            value={form.mood}
                            onChange={handleChange}
                            className="mood-input"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'white' }}
                        >
                            <option value="neutral">Neutral</option>
                            <option value="happy">Happy</option>
                            <option value="sad">Sad</option>
                            <option value="angry">Angry</option>
                        </select>
                    </div>

                    <div className="field-group file-field">
                        <label htmlFor="coverImage">Cover Image</label>
                        <div className="file-input-wrapper">
                            <input
                                id="coverImage"
                                name="coverImage"
                                type="file"
                                accept="image/*"
                                onChange={handleChange}
                            />
                            <div className="file-meta text-muted">
                                {form.coverImage ? form.coverImage.name : 'Choose an image (JPEG/PNG)'}
                            </div>
                        </div>
                    </div>

                    <div className="field-group file-field">
                        <label htmlFor="music">Music File</label>
                        <div className="file-input-wrapper">
                            <input
                                id="music"
                                name="music"
                                type="file"
                                accept="audio/*"
                                onChange={handleChange}
                            />
                            <div className="file-meta text-muted">
                                {form.music ? form.music.name : 'Select audio file (MP3/WAV)'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="preview-area">
                    {form.coverImage && coverPreview && (
                        <div className="cover-preview media-card">
                            <div className="media-head">
                                <strong className="media-title">Cover Image</strong>
                                <button type="button" className="btn btn-small remove-btn" onClick={() => removeFile('coverImage')}>Remove</button>
                            </div>
                            <img src={coverPreview} alt="Cover preview" className="cover-img" />
                        </div>
                    )}
                    {form.music && musicPreview && (
                        <div className="audio-preview media-card">
                            <div className="media-head">
                                <strong className="media-title">Audio</strong>
                                <button type="button" className="btn btn-small remove-btn" onClick={() => removeFile('music')}>Remove</button>
                            </div>
                            <audio ref={audioRef} controls src={musicPreview} onLoadedMetadata={handleAudioLoaded} />
                        </div>
                    )}
                </div>

                <div className="actions">
                    <button type="submit" className="btn btn-primary">Upload</button>
                    <button type="reset" className="btn" onClick={() => setForm({ title: '', mood: 'neutral', coverImage: null, music: null })}>Reset</button>
                </div>
            </form>
        </div>
    )
}