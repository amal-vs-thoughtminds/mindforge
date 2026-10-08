import { useEffect, useState } from 'react';
import { EVENT, PRIZES, TRACKS, TIMELINE, RULES, FAQ } from './content';
import RegisterForm from './components/RegisterForm.jsx';
import { api } from './api';
import { Link, usePath } from './router.jsx';
import { TeamsPage, TeamDetailPage } from './components/TeamsPages.jsx';

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    mins: Math.floor(diff / 60_000) % 60,
    secs: Math.floor(diff / 1000) % 60,
  };
}

function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <img src="/logo.svg" alt="ThoughtMinds" />
        </Link>
        <button className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
        </button>
        <nav className={open ? 'open' : ''}>
          <Link to="/#prizes" onClick={close}>Prizes</Link>
          <Link to="/#tracks" onClick={close}>Tracks</Link>
          <Link to="/#timeline" onClick={close}>Timeline</Link>
          <Link to="/teams" onClick={close}>Teams</Link>
          <Link to="/#faq" onClick={close}>FAQ</Link>
          <Link to="/#register" className="btn btn-accent btn-sm" onClick={close}>Register</Link>
        </nav>
      </div>
    </header>
  );
}

function Hero({ stats }) {
  const t = useCountdown(EVENT.deadline);
  return (
    <section className="hero" id="top">
      <div className="hero-glow" aria-hidden />
      <div className="container hero-inner">
        <p className="eyebrow">ThoughtMinds presents</p>
        <h1>
          {EVENT.name} <span className="accent">{EVENT.edition}</span>
        </h1>
        <p className="tagline">{EVENT.tagline}</p>
        <p className="lead">{EVENT.intro}</p>
        <div className="hero-meta">
          <span>📅 {EVENT.dateLabel}</span>
          <span>📍 {EVENT.venue}</span>
        </div>
        <div className="hero-cta">
          <a href="#register" className="btn btn-accent">Register now</a>
          <a href="#prizes" className="btn btn-ghost">See prizes</a>
        </div>
        <p className="countdown-label">{EVENT.countdownLabel}</p>
        <div className="countdown" aria-label={EVENT.countdownLabel}>
          {[
            ['Days', t.days],
            ['Hours', t.hours],
            ['Mins', t.mins],
            ['Secs', t.secs],
          ].map(([label, v]) => (
            <div key={label}>
              <strong>{String(v).padStart(2, '0')}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {stats && (
          <p className="stats">
            <b>{stats.participants}</b> hackers registered · <b>{stats.teams}</b> teams · <b>{stats.solo}</b> solo ·{' '}
            <Link to="/teams">See who's in →</Link>
          </p>
        )}
      </div>
    </section>
  );
}

function Prizes() {
  return (
    <section className="section dark" id="prizes">
      <div className="container">
        <p className="eyebrow">Rewards</p>
        <h2>Rewards for the top three</h2>
        {PRIZES.some((p) => !p.amount) && (
          <p className="reveal-note">
            <span className="pulse-dot" aria-hidden /> Prize money will be revealed soon. Stay tuned!
          </p>
        )}
        <div className="podium">
          {PRIZES.map((p) => (
            <article key={p.place} className={`prize prize-${p.place}`}>
              <div className="medal">{p.place}</div>
              <h3>{p.label}</h3>
              {p.amount ? (
                <p className="amount">{p.amount}</p>
              ) : (
                <div className="amount-hidden">
                  <p className="amount" aria-hidden>
                    ₹ ?,??,???
                  </p>
                  <span className="soon-badge">Revealing soon</span>
                </div>
              )}
              <ul>
                {p.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="note">Every participant who submits a project receives a certificate of participation.</p>
      </div>
    </section>
  );
}

function Tracks() {
  return (
    <section className="section" id="tracks">
      <div className="container">
        <p className="eyebrow">Tracks</p>
        <h2>Pick your playground</h2>
        <div className="grid-4">
          {TRACKS.map((t, i) => (
            <article key={t.name} className="card">
              <span className="card-num">0{i + 1}</span>
              <h3>{t.name}</h3>
              <p>{t.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Timeline() {
  return (
    <section className="section alt" id="timeline">
      <div className="container">
        <p className="eyebrow">Timeline</p>
        <h2>Key dates</h2>
        <ol className="timeline">
          {TIMELINE.map((s) => (
            <li key={s.title}>
              <span className="tl-date">{s.date}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Register({ onRegistered }) {
  return (
    <section className="section" id="register">
      <div className="container register">
        <div className="register-side">
          <p className="eyebrow">Registration</p>
          <h2>Claim your spot</h2>
          <p>Join on your own or bring a crew of 2–4. One email, one registration — so make it count.</p>
          <h3>Ground rules</h3>
          <ul className="rules">
            {RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <RegisterForm onRegistered={onRegistered} />
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="section alt" id="faq">
      <div className="container narrow">
        <p className="eyebrow">FAQ</p>
        <h2>Questions, answered</h2>
        {FAQ.map((f) => (
          <details key={f.q} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <img src="/logo.svg" alt="ThoughtMinds" />
        <p>
          {EVENT.name} {EVENT.edition} · {EVENT.dateLabel} · {EVENT.venue}
        </p>
        <p className="muted">© {new Date().getFullYear()} ThoughtMinds. All rights reserved.</p>
      </div>
      <img className="footer-art" src="/footer-logo.svg" alt="" aria-hidden />
    </footer>
  );
}

function Home() {
  const [stats, setStats] = useState(null);
  const loadStats = () => api.get('/api/stats').then(setStats).catch(() => {});
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <>
      <Hero stats={stats} />
      <Prizes />
      <Tracks />
      <Timeline />
      <Register onRegistered={loadStats} />
      <Faq />
    </>
  );
}

function Page({ path }) {
  if (path === '/' || path === '') return <Home />;
  if (path === '/teams' || path === '/teams/') return <TeamsPage />;
  const match = path.match(/^\/teams\/(\d+)\/?$/);
  if (match) return <TeamDetailPage id={match[1]} />;
  return (
    <section className="page-head">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <Link to="/" className="btn btn-accent">Back to home</Link>
      </div>
    </section>
  );
}

export default function App() {
  const path = usePath();

  // After client-side navigation to "/#section", scroll once the home page has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, [path]);

  return (
    <>
      <Nav />
      <main>
        <Page path={path} />
      </main>
      <Footer />
    </>
  );
}
