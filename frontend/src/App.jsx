// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import LoginPage from "./pages/login";
import FavoritesPage from "./pages/Favorites";
import EventDetail from "./pages/EventDetail";
import Legal from "./pages/Legal";
import GradientBackground from "./components/GradientBackground";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <GradientBackground />
        <Navbar />

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/event/:id" element={<EventDetail />} />
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/termini" element={<Legal doc="termini" />} />
            <Route path="/cookie" element={<Legal doc="cookie" />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
