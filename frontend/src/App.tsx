import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import Footer from './components/Footer';
import Header from './components/Header';
import Temperature from './pages/Temperature';
import Humidity from './pages/Humidity';
import Impressum from './pages/Impressum';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">              
        <Header />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/temperature" element={<Temperature />} />
            <Route path="/humidity" element={<Humidity />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/impressum" element={<Impressum />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App;
