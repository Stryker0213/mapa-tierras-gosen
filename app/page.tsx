export default function HomePage() {
  return (
    <main className="hero">
      <img className="hero-background" src="/images/ImagenesMirador/ImagesMiradorAtardecer.jpg" alt="Atardecer desde Tierras Gosén" />
      <div className="hero-overlay" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="Tierras Gosén, inicio">
          <span className="brand-mark"><img src="/assets/icons/icons8-hoja-48.png" alt="" /></span>
          <span><small>Explora el territorio</small><strong>Tierras Gosén</strong></span>
        </a>
        <a className="header-action" href="/mapa.html">Abrir mapa</a>
      </header>
      <section className="hero-content">
        <p className="eyebrow">Naturaleza · descanso · aventura</p>
        <h1>Encuentra tu próxima parada.</h1>
        <p className="description">Descubre la propiedad a tu ritmo: ubica alojamientos, senderos, miradores y experiencias desde un mapa pensado para acompañarte en el recorrido.</p>
        <div className="hero-actions">
          <a href="/mapa.html" className="btn btn-primary">Explorar el mapa <span aria-hidden="true">→</span></a>
          <a href="https://maps.app.goo.gl/wZyaDkqFVovWxBH16" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Cómo llegar</a>
        </div>
        <ul className="quick-facts" aria-label="Qué puedes encontrar">
          <li><strong>15</strong><span>lugares para descubrir</span></li>
          <li><strong>5</strong><span>tipos de experiencia</span></li>
          <li><strong>1</strong><span>mapa fácil de explorar</span></li>
        </ul>
      </section>
      <footer className="social-footer">
        <span>Síguenos</span>
        <nav aria-label="Redes sociales">
          <a href="https://www.instagram.com/tierrasgosen/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/profile.php?id=61565432173115" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://api.whatsapp.com/send/?phone=50688782626&amp;text&amp;type=phone_number&amp;app_absent=0" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </nav>
      </footer>
    </main>
  );
}
