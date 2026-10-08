import { useEffect, useMemo, useState } from 'react';
import { api, adminToken } from '../api';
import { Link } from '../router.jsx';
import { TRACKS } from '../content';

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

function useAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    if (!adminToken.get()) return;
    api.get('/api/admin/verify').then(() => setAdmin(true), () => adminToken.set(''));
  }, []);
  return [admin, setAdmin];
}

function AdminToggle({ admin, onChange }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  if (admin) {
    return (
      <div className="admin-pill">
        <span>🔓 Organiser view</span>
        <button
          className="link-btn"
          onClick={() => {
            adminToken.set('');
            onChange(false);
          }}
        >
          Lock
        </button>
      </div>
    );
  }
  if (!open) {
    return (
      <button className="btn btn-outline btn-sm admin-btn" onClick={() => setOpen(true)}>
        Organiser view
      </button>
    );
  }
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.get('/api/admin/verify', key);
      adminToken.set(key);
      onChange(true);
    } catch {
      setError('Invalid key');
    }
  };
  return (
    <form className="admin-form" onSubmit={submit}>
      <input
        type="password"
        placeholder="Organiser key"
        value={key}
        onChange={(e) => {
          setKey(e.target.value);
          setError('');
        }}
        autoFocus
        aria-label="Organiser key"
      />
      <button className="btn btn-primary btn-sm">Unlock</button>
      {error && <span className="field-error">{error}</span>}
    </form>
  );
}

function PageHeader({ eyebrow, title, children }) {
  return (
    <section className="page-head">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}

function Contact({ person }) {
  if (!person.email) return null;
  return (
    <div className="contact">
      <a href={`mailto:${person.email}`}>✉ {person.email}</a>
      <a href={`tel:${person.phone.replace(/[^\d+]/g, '')}`}>☎ {person.phone}</a>
    </div>
  );
}

function GithubLink({ url }) {
  if (!url) return null;
  return (
    <a className="gh-link" href={url} target="_blank" rel="noopener noreferrer">
      {url.replace(/^https?:\/\/(www\.)?/, '')}
    </a>
  );
}

export function TeamsPage() {
  const [admin, setAdmin] = useAdmin();
  const [tab, setTab] = useState('teams');
  const [teams, setTeams] = useState(null);
  const [solo, setSolo] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState('');

  useEffect(() => {
    api.get('/api/teams').then(setTeams, () => setError('Could not load teams.'));
  }, []);
  useEffect(() => {
    api.get('/api/solo').then(setSolo, () => setError('Could not load participants.'));
  }, [admin]);

  const q = query.trim().toLowerCase();
  const filteredTeams = useMemo(
    () =>
      (teams || []).filter(
        (t) =>
          (!track || t.track === track) &&
          (!q || [t.name, t.lead, t.registrationId, ...t.organizations].some((v) => v?.toLowerCase().includes(q)))
      ),
    [teams, q, track]
  );
  const filteredSolo = useMemo(
    () =>
      (solo || []).filter(
        (p) =>
          (!track || p.track === track) &&
          (!q ||
            [p.fullName, p.organization, p.role, p.registrationId, p.email].some((v) => v?.toLowerCase().includes(q)))
      ),
    [solo, q, track]
  );

  const loading = tab === 'teams' ? !teams : !solo;
  const list = tab === 'teams' ? filteredTeams : filteredSolo;

  return (
    <>
      <PageHeader eyebrow="Participants" title="Teams & hackers">
        <p className="page-sub">
          {teams && solo ? (
            <>
              <b>{teams.length}</b> teams · <b>{solo.length}</b> solo hackers ·{' '}
              <b>{teams.reduce((n, t) => n + t.memberCount, 0) + solo.length}</b> people building this quarter
            </>
          ) : (
            'Everyone building at MindForge this quarter.'
          )}
        </p>
      </PageHeader>

      <section className="section teams-section">
        <div className="container">
          <div className="toolbar">
            <div className="segmented small" role="tablist">
              {[
                ['teams', `Teams${teams ? ` (${teams.length})` : ''}`],
                ['solo', `Solo${solo ? ` (${solo.length})` : ''}`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  className={tab === key ? 'active' : ''}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              className="search"
              type="search"
              placeholder={tab === 'teams' ? 'Search team, lead, organisation…' : 'Search name, organisation…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search"
            />
            <select className="track-filter" value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Track">
              <option value="">All tracks</option>
              {TRACKS.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
            <AdminToggle admin={admin} onChange={setAdmin} />
          </div>

          {error && <div className="banner">{error}</div>}
          {loading && !error && <p className="muted center">Loading…</p>}
          {!loading && list.length === 0 && (
            <div className="empty">
              <p>{q || track ? 'No matches. Try a different search or track.' : `No ${tab === 'teams' ? 'teams' : 'solo hackers'} registered yet.`}</p>
              {!q && !track && (
                <Link to="/#register" className="btn btn-accent">
                  Be the first to register
                </Link>
              )}
            </div>
          )}

          {!loading && tab === 'teams' && (
            <div className="team-grid">
              {filteredTeams.map((t) => (
                <Link key={t.id} to={`/teams/${t.id}`} className="team-card">
                  <div className="team-card-top">
                    <span className="tag">{t.track}</span>
                    <span className="reg">{t.registrationId}</span>
                  </div>
                  <h3>{t.name}</h3>
                  {t.projectIdea && <p className="idea">{t.projectIdea}</p>}
                  <dl>
                    <div>
                      <dt>Lead</dt>
                      <dd>{t.lead}</dd>
                    </div>
                    <div>
                      <dt>Members</dt>
                      <dd>{t.memberCount}</dd>
                    </div>
                    <div className="wide">
                      <dt>From</dt>
                      <dd>{t.organizations.join(', ')}</dd>
                    </div>
                  </dl>
                  <span className="team-card-cta">View team →</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && tab === 'solo' && (
            <div className="team-grid">
              {filteredSolo.map((p) => (
                <article key={p.id} className="team-card person-card">
                  <div className="team-card-top">
                    <span className="tag">{p.track}</span>
                    <span className="reg">{p.registrationId}</span>
                  </div>
                  <div className="person">
                    <span className="avatar">{initials(p.fullName)}</span>
                    <div>
                      <h3>{p.fullName}</h3>
                      <p className="muted">{[p.role, p.organization].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <GithubLink url={p.githubUrl} />
                  <Contact person={p} />
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function TeamDetailPage({ id }) {
  const [admin, setAdmin] = useAdmin();
  const [team, setTeam] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api.get(`/api/teams/${id}`).then(setTeam, (e) => setError(e.status === 404 ? 'notfound' : 'Could not load this team.'));
  }, [id, admin]);

  if (error === 'notfound') {
    return (
      <PageHeader eyebrow="Teams" title="Team not found">
        <p className="page-sub">It may have been removed, or the link is wrong.</p>
        <Link to="/teams" className="btn btn-accent">← All teams</Link>
      </PageHeader>
    );
  }

  return (
    <>
      <PageHeader eyebrow={team ? team.registrationId : 'Team'} title={team ? team.name : 'Loading…'}>
        <Link to="/teams" className="back-link">← All teams</Link>
        {team && (
          <div className="team-meta">
            <span className="tag tag-lime">{team.track}</span>
            <span>{team.members.length} members</span>
            <span>Registered {formatDate(team.createdAt)}</span>
          </div>
        )}
      </PageHeader>

      <section className="section teams-section">
        <div className="container">
          {error && <div className="banner">{error}</div>}
          {team && (
            <>
              <div className="toolbar end">
                <AdminToggle admin={admin} onChange={setAdmin} />
              </div>
              <div className="detail-grid">
                <article className="card idea-card">
                  <h2>Project idea</h2>
                  <p>{team.projectIdea || <span className="muted">The team hasn't shared their idea yet.</span>}</p>
                </article>
                <div>
                  <h2>Members</h2>
                  <ul className="member-list">
                    {team.members.map((m) => (
                      <li key={m.id} className="member-row">
                        <span className="avatar">{initials(m.fullName)}</span>
                        <div className="member-info">
                          <h3>
                            {m.fullName}
                            {m.isTeamLead && <span className="lead-badge">Lead</span>}
                          </h3>
                          <p className="muted">{[m.role, m.organization].filter(Boolean).join(' · ')}</p>
                          <GithubLink url={m.githubUrl} />
                          <Contact person={m} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
