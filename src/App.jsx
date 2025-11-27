import { Routes, Route } from 'react-router-dom'
import './App.css'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import ArtistDashboard from './pages/artist/ArtistDashboard';
import UploadMusic from './pages/artist/UploadMusic';
import MusicPlayer from './pages/music/MusicPlayer';
import PlaylistDetails from './pages/music/PlaylistDetails';
import { io } from 'socket.io-client'


function App() {

  const [ socket, setSocket ] = useState(null)

  useEffect(() => {
    // 1. Use the dynamic variable (Production Safe)
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3002";

    // 2. Add 'transports' to force Websockets (Critical for Render)
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"], 
      autoConnect: true
    })

    setSocket(newSocket)

    newSocket.on("play", (data) => {
      const musicId = data.musicId
      window.location.href = `/music/${musicId}`
    })

    // 3. Cleanup: Disconnect socket when component unmounts
    return () => {
      newSocket.disconnect();
    }

  }, [])

  return (
    <div>
      <main>
        <Routes>
          <Route path="/" element={<Home socket={socket}/>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/artist/dashboard" element={<ArtistDashboard />} />
          <Route path="/artist/dashboard/upload-music" element={<UploadMusic />} />
          <Route path="/music/:id" element={<MusicPlayer />} />
          <Route path="/playlist/:id" element={<PlaylistDetails />} />
        </Routes>
      </main>
    </div>
  )
}

export default App