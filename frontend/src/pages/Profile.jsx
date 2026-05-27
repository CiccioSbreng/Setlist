// frontend/src/pages/Profile.jsx

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getProfile, updateProfile, updatePassword, getFavorites } from "../lib/api";
import { UserIcon, HeartIcon, MusicIcon, LockIcon } from "../components/Icons";

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 220;
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [favCount, setFavCount] = useState(null);
  const [form, setForm] = useState({ displayName: "", bio: "", avatar: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [pwMsg, setPwMsg] = useState({ text: "", ok: true });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [section, setSection] = useState("profilo"); // profilo | password

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ displayName: p.displayName || "", bio: p.bio || "", avatar: p.avatar || "" });
      })
      .catch(() => navigate("/login"));
    getFavorites().then((list) => setFavCount(list.length)).catch(() => {});
  }, [navigate]);

  async function handleAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await compressImage(file);
    setForm((f) => ({ ...f, avatar: b64 }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setMsg({ text: "", ok: true });
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setMsg({ text: "Profilo aggiornato!", ok: true });
      toast.success("Profilo aggiornato!");
    } catch (err) {
      setMsg({ text: err.message, ok: false });
      toast.error(err.message || "Errore aggiornamento profilo.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword(e) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ text: "Le nuove password non coincidono.", ok: false }); return;
    }
    setSavingPw(true); setPwMsg({ text: "", ok: true });
    try {
      await updatePassword(pwForm.current, pwForm.next);
      setPwMsg({ text: "Password aggiornata!", ok: true });
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Password aggiornata!");
    } catch (err) {
      setPwMsg({ text: err.message, ok: false });
      toast.error(err.message || "Errore aggiornamento password.");
    } finally {
      setSavingPw(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/home");
  }

  if (!profile) return null;

  return (
    <section className="section">
      <div className="wrap">
        <div className="pf">

          {/* Sidebar */}
          <aside className="pf__side">
            <div className="pf__avatar-wrap" onClick={() => fileRef.current?.click()}>
              {form.avatar
                ? <img className="pf__avatar-img" src={form.avatar} alt="avatar" />
                : <UserIcon size={40} />}
              <div className="pf__avatar-overlay">
                <span>Cambia foto</span>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
            <p className="pf__email">{profile.email}</p>
            {profile.displayName && <p className="pf__name">{profile.displayName}</p>}
            {favCount !== null && (
              <p className="pf__stat"><HeartIcon size={14} filled /> {favCount} preferiti</p>
            )}
            <div className="pf__nav">
              <button type="button" className={`pf__nav-btn${section === "profilo" ? " active" : ""}`} onClick={() => setSection("profilo")}>
                <UserIcon size={16} />Profilo
              </button>
              <button type="button" className={`pf__nav-btn${section === "password" ? " active" : ""}`} onClick={() => setSection("password")}>
                <LockIcon size={16} />Password
              </button>
            </div>
            <div className="pf__side-links">
              <Link to="/favorites" className="btn btn--ghost btn--sm"><HeartIcon size={16} />Preferiti</Link>
              <Link to="/home" className="btn btn--ghost btn--sm"><MusicIcon size={16} />Esplora</Link>
              <button type="button" className="btn btn--ghost btn--sm pf__logout" onClick={handleLogout}>Esci</button>
            </div>
          </aside>

          {/* Main */}
          <div className="pf__main">

            {section === "profilo" && (
              <form className="pf__form" onSubmit={handleSave}>
                <h2>Il mio profilo</h2>

                <div className="pf__field">
                  <label>Nome visualizzato</label>
                  <input
                    type="text"
                    placeholder="Come vuoi essere chiamato?"
                    maxLength={60}
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  />
                </div>

                <div className="pf__field">
                  <label>Bio <span className="pf__count">{form.bio.length}/200</span></label>
                  <textarea
                    placeholder="Raccontati in poche parole…"
                    maxLength={200}
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  />
                </div>

                <div className="pf__field">
                  <label>Foto profilo</label>
                  <div className="pf__avatar-row">
                    <div className="pf__avatar-preview">
                      {form.avatar ? <img src={form.avatar} alt="" /> : <UserIcon size={28} />}
                    </div>
                    <button type="button" className="btn btn--outline btn--sm" onClick={() => fileRef.current?.click()}>
                      Carica immagine
                    </button>
                    {form.avatar && (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setForm((f) => ({ ...f, avatar: "" }))}>
                        Rimuovi
                      </button>
                    )}
                  </div>
                </div>

                {msg.text && (
                  <div className={`banner ${msg.ok ? "banner--ok" : "banner--error"}`}>{msg.text}</div>
                )}

                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? "Salvataggio…" : "Salva modifiche"}
                </button>
              </form>
            )}

            {section === "password" && (
              <form className="pf__form" onSubmit={handlePassword}>
                <h2>Cambia password</h2>

                <div className="pf__field">
                  <label>Password attuale</label>
                  <input type="password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} />
                </div>

                <div className="pf__field">
                  <label>Nuova password</label>
                  <input type="password" placeholder="Min 6 caratteri" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} />
                </div>

                <div className="pf__field">
                  <label>Conferma nuova password</label>
                  <input type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} />
                </div>

                {pwMsg.text && (
                  <div className={`banner ${pwMsg.ok ? "banner--ok" : "banner--error"}`}>{pwMsg.text}</div>
                )}

                <button type="submit" className="btn btn--primary" disabled={savingPw}>
                  {savingPw ? "Aggiornamento…" : "Aggiorna password"}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
