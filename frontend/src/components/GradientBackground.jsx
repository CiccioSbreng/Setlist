// frontend/src/components/GradientBackground.jsx
// Gradient mesh animato in stile sito musicale moderno: grandi macchie
// di colore brand sfocate che si muovono lente e si fondono. Puro CSS.

export default function GradientBackground() {
  return (
    <div className="gradient-bg" aria-hidden="true">
      <span className="gradient-bg__blob gradient-bg__blob--1" />
      <span className="gradient-bg__blob gradient-bg__blob--2" />
      <span className="gradient-bg__blob gradient-bg__blob--3" />
      <span className="gradient-bg__blob gradient-bg__blob--4" />
      <div className="gradient-bg__veil" />
    </div>
  );
}
