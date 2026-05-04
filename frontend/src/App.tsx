import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SensorProvider } from "./context/SensorContext";
import { AuthProvider } from "./context/AuthContext";

import Dashboard from "./pages/Dashboard/Dashboard";
import History from "./pages/History/History";
import Settings from "./pages/Settings/Settings";
import Temperature from "./pages/Temperature/Temperature";
import Humidity from "./pages/Humidity/Humidity";
import Alarms from "./pages/Alarm/Alarm";
import Impressum from "./pages/Imprint/Imprint";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SensorProvider>
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
                <Route path="/alarms" element={<Alarms />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </SensorProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
