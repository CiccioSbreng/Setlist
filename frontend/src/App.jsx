// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import LoginPage from "./pages/login";
import FavoritesPage from "./pages/Favorites";
import EventDetail from "./pages/EventDetail";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/Profile";
import GradientBackground from "./components/GradientBackground";
import VideoBackground from "./components/VideoBackground";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <VideoBackground />
        <GradientBackground />
        <Navbar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/termini" element={<Legal doc="termini" />} />
            <Route path="/cookie" element={<Legal doc="cookie" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />

        <div
          style={{
            position: "fixed",
            bottom: 8,
            right: 8,
            zIndex: 99999,
            background: "#ff2d55",
            color: "#fff",
            font: "700 12px/1.2 system-ui, sans-serif",
            padding: "6px 10px",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,.5)",
            pointerEvents: "none",
          }}
        >
          BUILD NUOVA · 19/05 player 152px
        </div>
      </div>
    </BrowserRouter>
  );
}
