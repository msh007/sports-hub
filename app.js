const API_KEY = '632a6a457e340ff67fb4a9c5a065141a';

const SPORTS = {
  football: { base: 'https://v3.football.api-sports.io', endpoint: 'fixtures', name: 'Football' },
  basketball: { base: 'https://v1.basketball.api-sports.io', endpoint: 'games', name: 'Basketball' },
  baseball: { base: 'https://v1.baseball.api-sports.io', endpoint: 'games', name: 'Baseball' },
  hockey: { base: 'https://v1.hockey.api-sports.io', endpoint: 'games', name: 'Hockey' },
  'american-football': { base: 'https://v1.american-football.api-sports.io', endpoint: 'games', name: 'American Football' },
  volleyball: { base: 'https://v1.volleyball.api-sports.io', endpoint: 'games', name: 'Volleyball' }
};

let currentTimezone = 'Asia/Dhaka';
let refreshInterval = null;

// DOM elements
const timezoneSelect = document.getElementById('timezone-select');
const refreshBtn = document.getElementById('refresh-btn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const liveContainer = document.getElementById('live-matches');
const upcomingContainer = document.getElementById('upcoming-matches');
const sportMatchesContainer = document.getElementById('sport-matches');
const sportCards = document.querySelectorAll('.sport-card');

// Init
timezoneSelect.addEventListener('change', (e) => {
  currentTimezone = e.target.value;
  loadAll();
});

refreshBtn.addEventListener('click', loadAll);

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'live' || tab.dataset.tab === 'upcoming') loadAll();
  });
});

sportCards.forEach(card => {
  card.addEventListener('click', () => {
    sportCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const sport = card.dataset.sport;
    loadSportMatches(sport);
  });
});

async function apiFetch(url) {
  try {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length) {
      console.warn('API errors:', data.errors);
    }
    return data.response || [];
  } catch (err) {
    console.error('API fetch error:', err);
    return [];
  }
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function formatTime(isoString) {
  if (!isoString) return 'TBD';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      timeZone: currentTimezone,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short'
    });
  } catch {
    return isoString;
  }
}

function renderMatches(matches, container, isLiveSection = false) {
  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="empty">No matches found for the selected filters.</div>';
    return;
  }

  container.innerHTML = matches.map(m => {
    // Normalize structure (football vs other sports)
    const isFootball = m.fixture !== undefined;
    const fixture = isFootball ? m.fixture : m;
    const teams = isFootball ? m.teams : m.teams;
    const goals = isFootball ? m.goals : (m.scores || {});
    const league = isFootball ? m.league : m.league;
    const status = isFootball ? fixture.status : (m.status || {});

    const home = teams.home || teams.homeTeam || {};
    const away = teams.away || teams.awayTeam || {};
    const homeScore = isFootball ? (goals.home ?? '-') : (goals.home?.total ?? goals.home ?? '-');
    const awayScore = isFootball ? (goals.away ?? '-') : (goals.away?.total ?? goals.away ?? '-');

    const isLive = status.short && ['1H','2H','HT','ET','BT','P','LIVE','Q1','Q2','Q3','Q4','OT'].includes(status.short);
    const statusText = status.long || status.short || 'Scheduled';
    const kickoff = formatTime(fixture.date || m.date);

    return `
      <div class="match-card ${isLive ? 'live' : ''}">
        <div class="league">${league?.name || 'League'} ${league?.country ? '• ' + league.country : ''}</div>
        <div class="teams">
          <div class="team">
            ${home.logo ? `<img src="${home.logo}" alt="">` : ''}
            <span class="team-name">${home.name || 'Home'}</span>
          </div>
          <div class="score">${homeScore} - ${awayScore}</div>
          <div class="team" style="justify-content: flex-end;">
            <span class="team-name">${away.name || 'Away'}</span>
            ${away.logo ? `<img src="${away.logo}" alt="">` : ''}
          </div>
        </div>
        <div class="meta">
          <span class="status ${isLive ? 'live' : ''}">${statusText}</span>
          <span>${kickoff}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadLive() {
  liveContainer.innerHTML = '<div class="loading">Loading live matches...</div>';
  // Focus on football for live (most reliable); can expand later
  const url = `${SPORTS.football.base}/fixtures?live=all&timezone=${encodeURIComponent(currentTimezone)}`;
  const matches = await apiFetch(url);
  renderMatches(matches.slice(0, 30), liveContainer, true);
}

async function loadUpcoming() {
  upcomingContainer.innerHTML = '<div class="loading">Loading upcoming matches...</div>';
  const today = getTodayDate();
  const tomorrow = getTomorrowDate();
  const url = `${SPORTS.football.base}/fixtures?date=${today}&timezone=${encodeURIComponent(currentTimezone)}&status=NS`;
  let matches = await apiFetch(url);
  // Also try tomorrow if few results
  if (matches.length < 10) {
    const url2 = `${SPORTS.football.base}/fixtures?date=${tomorrow}&timezone=${encodeURIComponent(currentTimezone)}&status=NS`;
    const more = await apiFetch(url2);
    matches = matches.concat(more);
  }
  renderMatches(matches.slice(0, 40), upcomingContainer);
}

async function loadSportMatches(sportKey) {
  const sport = SPORTS[sportKey];
  if (!sport) return;
  sportMatchesContainer.innerHTML = `<div class="loading">Loading ${sport.name} matches...</div>`;

  const today = getTodayDate();
  let url;
  if (sportKey === 'football') {
    url = `${sport.base}/fixtures?date=${today}&timezone=${encodeURIComponent(currentTimezone)}`;
  } else {
    url = `${sport.base}/${sport.endpoint}?date=${today}&timezone=${encodeURIComponent(currentTimezone)}`;
  }
  const matches = await apiFetch(url);
  renderMatches(matches.slice(0, 30), sportMatchesContainer);
}

async function loadAll() {
  await Promise.all([loadLive(), loadUpcoming()]);
  // Start auto-refresh for live
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(loadLive, 30000); // every 30s
}

// Start
loadAll();

// Save timezone preference
timezoneSelect.addEventListener('change', () => {
  localStorage.setItem('sportsTimezone', timezoneSelect.value);
});
const savedTZ = localStorage.getItem('sportsTimezone');
if (savedTZ) {
  timezoneSelect.value = savedTZ;
  currentTimezone = savedTZ;
}
