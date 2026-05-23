// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
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
import { PageTransition } from "./components/Motion";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageTransition>
      <Routes location={location}>
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
    </PageTransition>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <VideoBackground />
        <GradientBackground />
        <Navbar />

        <main className="app-main">
          <AnimatedRoutes />
        </main>

        <Footer />
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </div>
    </BrowserRouter>
  );
}
