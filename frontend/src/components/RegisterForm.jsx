import { useEffect, useState } from 'react';
import { api } from '../api';
import { TRACKS } from '../content';

const emptyMember = () => ({ fullName: '', email: '', phone: '', organization: '', role: '', githubUrl: '' });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_TAKEN = 'Already registered solo or in a team';
const NAME_TAKEN = 'Team name already taken';

function Field({ label, error, hint, required, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">
        {label}
        {required && <i aria-hidden> *</i>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

function MemberFields({ prefix, value, onChange, errors, onEmailBlur }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  const err = (k) => errors[`${prefix}.${k}`];
  return (
    <div className="grid-2">
      <Field label="Full name" required error={err('fullName')}>
        <input value={value.fullName} onChange={set('fullName')} autoComplete="name" maxLength={100} />
      </Field>
      <Field label="Email" required error={err('email')}>
        <input
          type="email"
          value={value.email}
          onChange={set('email')}
          onBlur={() => onEmailBlur(prefix, value.email)}
          autoComplete="email"
          maxLength={254}
        />
      </Field>
      <Field label="Phone" required error={err('phone')}>
        <input type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" placeholder="+91 98765 43210" />
      </Field>
      <Field label="College / Company" required error={err('organization')}>
        <input value={value.organization} onChange={set('organization')} maxLength={120} />
      </Field>
      <Field label="Role / Year" error={err('role')}>
        <input value={value.role} onChange={set('role')} placeholder="e.g. SDE II, 3rd-year B.Tech" maxLength={80} />
      </Field>
      <Field label="GitHub / Portfolio" error={err('githubUrl')}>
        <input type="url" value={value.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />
      </Field>
    </div>
  );
}

export default function RegisterForm({ onRegistered }) {
  const [mode, setMode] = useState('solo');
  const [config, setConfig] = useState({
    tracks: TRACKS.map((t) => t.name),
    minTeamSize: 2,
    maxTeamSize: 4,
    registrationOpen: true,
  });
  const [solo, setSolo] = useState(emptyMember());
  const [team, setTeam] = useState({ teamName: '', projectIdea: '', members: [emptyMember(), emptyMember()] });
  const [track, setTrack] = useState('');
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.get('/api/event').then(setConfig).catch(() => {});
  }, []);

  const setFieldError = (key, msg) =>
    setErrors((e) => {
      const next = { ...e };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });

  // Early feedback: tell people an email is already used before they submit.
  const checkEmail = async (prefix, email) => {
    const key = `${prefix}.email`;
    const v = email.trim().toLowerCase();
    if (!v) return;
    if (!EMAIL_RE.test(v)) return setFieldError(key, 'Enter a valid email address');
    if (mode === 'team') {
      const idx = Number(prefix.split('.')[1]);
      const dup = team.members.findIndex((m, i) => i !== idx && m.email.trim().toLowerCase() === v);
      if (dup !== -1) return setFieldError(key, `Same email as member ${dup + 1}`);
    }
    try {
      const { available } = await api.get(`/api/check/email?email=${encodeURIComponent(v)}`);
      setFieldError(key, available ? null : EMAIL_TAKEN);
    } catch {
      setFieldError(key, null);
    }
  };

  const checkTeamName = async () => {
    const name = team.teamName.trim();
    if (!name) return;
    try {
      const { available } = await api.get(`/api/check/team-name?name=${encodeURIComponent(name)}`);
      setFieldError('teamName', available ? null : NAME_TAKEN);
    } catch {
      /* server validates again on submit */
    }
  };

  const updateMember = (i, m) => setTeam((t) => ({ ...t, members: t.members.map((x, j) => (j === i ? m : x)) }));
  const addMember = () => setTeam((t) => ({ ...t, members: [...t.members, emptyMember()] }));
  const removeMember = (i) => {
    setTeam((t) => ({ ...t, members: t.members.filter((_, j) => j !== i) }));
    setErrors({});
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setBanner(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBanner(null);
    setSubmitting(true);
    try {
      const res =
        mode === 'solo'
          ? await api.post('/api/registrations/solo', { participant: solo, track, agreeToRules: agree })
          : await api.post('/api/registrations/team', { ...team, track, agreeToRules: agree });
      setSuccess(res);
      onRegistered?.();
    } catch (err) {
      // A 422 means the server stopped at field validation and never checked
      // availability, so keep the "already registered" hints from blur checks.
      const keep = (prev) =>
        err.status === 422
          ? Object.fromEntries(Object.entries(prev).filter(([, msg]) => msg === EMAIL_TAKEN || msg === NAME_TAKEN))
          : {};
      setErrors((prev) => ({ ...keep(prev), ...err.fields }));
      setBanner(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuccess(null);
    setSolo(emptyMember());
    setTeam({ teamName: '', projectIdea: '', members: [emptyMember(), emptyMember()] });
    setTrack('');
    setAgree(false);
    setErrors({});
  };

  if (success) {
    return (
      <div className="form-card success">
        <div className="success-badge">✓</div>
        <h3>{success.message}</h3>
        <p>Your registration ID</p>
        <p className="reg-id">{success.registrationId}</p>
        <p className="muted">Keep this handy — you'll need it at check-in. Happy building — see you at the December evaluation!</p>
        <button className="btn btn-primary" onClick={reset}>Register someone else</button>
      </div>
    );
  }

  if (!config.registrationOpen) {
    return (
      <div className="form-card success">
        <h3>Registrations are closed</h3>
        <p className="muted">Thanks for the overwhelming response. See you at the next edition!</p>
      </div>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      <div className="segmented" role="tablist">
        {[
          ['solo', 'Solo'],
          ['team', 'Team'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            className={mode === key ? 'active' : ''}
            onClick={() => switchMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {banner && (
        <div className="banner" role="alert">
          {banner}
        </div>
      )}

      {mode === 'solo' ? (
        <MemberFields prefix="participant" value={solo} onChange={setSolo} errors={errors} onEmailBlur={checkEmail} />
      ) : (
        <>
          <div className="grid-2">
            <Field label="Team name" required error={errors.teamName}>
              <input
                value={team.teamName}
                onChange={(e) => setTeam({ ...team, teamName: e.target.value })}
                onBlur={checkTeamName}
                maxLength={60}
              />
            </Field>
            <Field label="Project idea" error={errors.projectIdea} hint="Optional — a line or two is plenty">
              <input
                value={team.projectIdea}
                onChange={(e) => setTeam({ ...team, projectIdea: e.target.value })}
                maxLength={1000}
              />
            </Field>
          </div>
          {errors.members && <div className="banner">{errors.members}</div>}
          {team.members.map((m, i) => (
            <fieldset key={i} className="member">
              <legend>
                {i === 0 ? 'Team lead' : `Member ${i + 1}`}
                {i >= config.minTeamSize && (
                  <button type="button" className="link-btn" onClick={() => removeMember(i)}>
                    Remove
                  </button>
                )}
              </legend>
              <MemberFields
                prefix={`members.${i}`}
                value={m}
                onChange={(v) => updateMember(i, v)}
                errors={errors}
                onEmailBlur={checkEmail}
              />
            </fieldset>
          ))}
          {team.members.length < config.maxTeamSize && (
            <button type="button" className="btn btn-outline add-member" onClick={addMember}>
              + Add member ({team.members.length}/{config.maxTeamSize})
            </button>
          )}
        </>
      )}

      <Field label="Track" required error={errors.track}>
        <select value={track} onChange={(e) => setTrack(e.target.value)}>
          <option value="">Select a track…</option>
          {config.tracks.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <label className={`check ${errors.agreeToRules ? 'has-error' : ''}`}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>
          I agree to the hackathon rules and code of conduct
          {mode === 'team' && ', and confirm my teammates have agreed to be registered'}.
        </span>
      </label>
      {errors.agreeToRules && <span className="field-error">{errors.agreeToRules}</span>}

      <button className="btn btn-accent btn-block" disabled={submitting}>
        {submitting ? 'Registering…' : mode === 'solo' ? 'Register solo' : `Register team of ${team.members.length}`}
      </button>
    </form>
  );
}
