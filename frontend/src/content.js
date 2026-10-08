// All event copy lives here so organisers can edit it without touching components.
export const EVENT = {
  name: 'MindForge',
  edition: "Q4 '26",
  tagline: 'Forge the future of intelligent work.',
  intro:
    'The ThoughtMinds quarterly hackathon. Register any time, build at your own pace through the quarter, and show what you made at the December evaluation.',
  // The hero countdown runs to the registration deadline.
  deadline: '2026-12-10T23:59:59+05:30',
  countdownLabel: 'Registration closes in',
  dateLabel: 'Register by Dec 10 · Evaluation in December 2026',
  venue: 'ThoughtMinds',
};

// The prize pool shows as "Revealing soon" until announced: set `amount` (e.g. '₹1,75,000') to reveal it.
export const PRIZE_POOL = {
  amount: null,
  teaser: 'The top teams take home the rewards. The full prize pool will be announced soon. Register now so you are in the running.',
};

export const TRACKS = [
  { name: 'GenAI & Agents', desc: 'LLM apps, copilots and autonomous agents that get real work done.' },
  { name: 'Data & Analytics', desc: 'Turn messy data into decisions with pipelines, insights and dashboards.' },
  { name: 'Intelligent Automation', desc: 'Kill the busywork — workflow and process automation powered by AI.' },
  { name: 'Open Innovation', desc: "Doesn't fit a box? Build the thing you wish existed." },
];

export const TIMELINE = [
  { date: 'Open now', title: 'Register any time', desc: 'Sign up solo or with a team of 2–4, whenever you are ready.' },
  { date: 'Oct – Dec', title: 'Build through the quarter', desc: 'Work on your project at your own pace.' },
  { date: 'Dec 10', title: 'Registration closes', desc: '11:59 PM IST. No late entries.' },
  { date: 'December', title: 'Evaluation & demos', desc: 'Present your project to the jury.' },
  { date: 'December', title: 'Winners announced', desc: 'Awards, trophies and celebrations.' },
];

export const RULES = [
  'Teams have 2–4 members. Solo participants are welcome and can be matched with others on request.',
  'Each email can be registered only once — either solo or in exactly one team.',
  'Projects must be built during this quarter. Open-source libraries and APIs are allowed.',
  'Projects are judged on impact, innovation, technical execution and presentation.',
  "The jury's decision is final. Prizes are awarded per team.",
];

export const FAQ = [
  {
    q: 'Can I register solo and still join a team later?',
    a: "Not through this form — an email can be used only once. If you're registering solo, our organisers can help you find teammates.",
  },
  {
    q: 'Someone already registered me in their team. What now?',
    a: "You're all set — you don't need to register again. Trying to register the same email twice will be rejected.",
  },
  { q: 'Is there a registration fee?', a: 'No. MindForge is completely free to join.' },
  {
    q: 'When can I register?',
    a: 'Any time until December 10, 2026 (11:59 PM IST). Registering early just gives you more time to build.',
  },
  {
    q: 'When is the evaluation?',
    a: 'In December, after registration closes. Registered participants will be told the exact date and format.',
  },
  {
    q: 'Who owns the project?',
    a: 'You do. Teams retain full ownership of what they build.',
  },
];
