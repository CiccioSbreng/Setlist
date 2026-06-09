// frontend/src/App.jsx

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigationType } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import LoginPage from "./pages/login";
import FavoritesPage from "./pages/Favorites";
import EventDetail from "./pages/EventDetail";
import ArtistPage  from "./pages/ArtistPage";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/Profile";
import GradientBackground from "./components/GradientBackground";
import VideoBackground from "./components/VideoBackground";
import { PageTransition } from "./components/Motion";
import BottomNav from "./components/BottomNav";
import BackToTop from "./components/BackToTop";

function ScrollRestorer() {
  const { key } = useLocation();
  const navType = useNavigationType();

  // Ripristina posizione su navigazione "back" (POP), scroll top solo su nuova pagina (PUSH)
  useEffect(() => {
    if (navType === "REPLACE") return; // cambio parametri URL nella stessa pagina → non scrollare
    if (navType !== "POP") {
      window.scrollTo(0, 0);
      return;
    }
    const saved = sessionStorage.getItem(`scroll:${key}`);
    if (!saved) return;
    const target = parseInt(saved, 10);
    // Riprova finché la pagina è abbastanza alta (contenuto async)
    let tries = 0;
    const attempt = () => {
      if (document.documentElement.scrollHeight >= target + window.innerHeight || tries++ >= 20) {
        window.scrollTo(0, target);
      } else {
        requestAnimationFrame(attempt);
      }
    };
    requestAnimationFrame(attempt);
  }, [key, navType]);

  // Salva posizione corrente quando si lascia la route
  useEffect(() => {
    return () => {
      sessionStorage.setItem(`scroll:${key}`, String(Math.round(window.scrollY)));
    };
  }, [key]);

  return null;
}

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
        <Route path="/event/:id"   element={<EventDetail />} />
        <Route path="/artist/:id" element={<ArtistPage />} />
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
      <ScrollRestorer />
      <div className="app-shell">
        <VideoBackground />
        <GradientBackground />
        <div className="grain-overlay" aria-hidden="true" />
        <Navbar />

        <main className="app-main">
          <AnimatedRoutes />
        </main>

        <Footer />
        <BottomNav />
        <BackToTop />
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </div>
    </BrowserRouter>
  );
}
