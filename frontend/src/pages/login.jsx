// frontend/src/pages/Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../lib/api";
import {
  UserIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
} from "../components/Icons";

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwdValid = password.length >= 6;
  const formValid = emailValid && pwdValid;

  function switchMode(next) {
    setMode(next);
    setError("");
    setTouched({ email: false, password: false });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!formValid) return;

    setError("");
    setLoading(true);

    try {
      const fn = mode === "login" ? loginUser : registerUser;
      await fn(email, password);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Si è verificato un errore. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card appear">
        <div className="auth__icon">
          <UserIcon size={26} />
        </div>

        <h1 className="auth__title">
          {mode === "login" ? "Bentornato" : "Crea il tuo account"}
        </h1>
        <p className="auth__sub">
          {mode === "login"
            ? "Accedi per ritrovare i tuoi eventi preferiti."
            : "Registrati gratis e inizia a salvare i tuoi concerti."}
        </p>

        <div className="seg" role="tablist">
          <button
            type="button"
            className={"seg__btn" + (mode === "login" ? " is-active" : "")}
            onClick={() => switchMode("login")}
          >
            Accedi
          </button>
          <button
            type="button"
            className={"seg__btn" + (mode === "register" ? " is-active" : "")}
            onClick={() => switchMode("register")}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <MailIcon size={18} />
              <input
                id="email"
                type="email"
                className={
                  "input" +
                  (touched.email && !emailValid ? " has-error" : "")
                }
                placeholder="nome@email.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              />
            </div>
            {touched.email && !emailValid && (
              <div className="field-error">Inserisci un'email valida.</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <LockIcon size={18} />
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                className={
                  "input" +
                  (touched.password && !pwdValid ? " has-error" : "")
                }
                placeholder="Almeno 6 caratteri"
                value={password}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={
                  showPwd ? "Nascondi password" : "Mostra password"
                }
              >
                {showPwd ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {touched.password && !pwdValid ? (
              <div className="field-error">
                La password deve avere almeno 6 caratteri.
              </div>
            ) : (
              mode === "register" && (
                <div className="hint">Usa almeno 6 caratteri.</div>
              )
            )}
          </div>

          {error && (
            <div className="banner banner--error" style={{ marginBottom: 18 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={loading}
          >
            {loading
              ? "Attendere…"
              : mode === "login"
              ? "Accedi"
              : "Crea account"}
          </button>
        </form>

        <p className="auth__foot">
          {mode === "login" ? (
            <>
              Non hai un account?{" "}
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  switchMode("register");
                }}
              >
                Registrati
              </a>
            </>
          ) : (
            <>
              Hai già un account?{" "}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  switchMode("login");
                }}
              >
                Accedi
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
