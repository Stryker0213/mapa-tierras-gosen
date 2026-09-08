export default function AccessDeniedPage() {
  return (
    <main className="access-page">
      <section className="access-card">
        <span className="access-icon" aria-hidden="true">🔒</span>
        <p className="eyebrow">Acceso restringido</p>
        <h1>Esta cuenta no administra el mapa.</h1>
        <p>Inicia sesión con una cuenta autorizada o vuelve al mapa público.</p>
        <div className="access-actions">
          <a className="btn btn-primary" href="/mapa.html">Ver mapa</a>
          <a className="btn btn-secondary" href="/signout-with-chatgpt?return_to=%2F">Cambiar cuenta</a>
        </div>
      </section>
    </main>
  );
}
