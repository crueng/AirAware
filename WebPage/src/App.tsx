import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ParticleCanvas from './components/ParticleCanvas'
import FloatingLeaves from './components/FloatingLeaves'
import GlowOrb from './components/GlowOrb'
import Home from './pages/Home'
import ImpressumPage from './pages/ImpressumPage'

function App() {
  return (
    <>
      <ParticleCanvas />
      <GlowOrb />
      <FloatingLeaves />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/impressum" element={<ImpressumPage />} />
      </Routes>
    </>
  )
}

export default App
