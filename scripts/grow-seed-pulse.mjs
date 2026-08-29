#!/usr/bin/env node
// grow-seed-pulse.mjs — the seed season's heartbeat, counts only.
//
// Reads the operator's GitHub repositories touched during the seed season and
// writes public/pulse/seed.json: one entry per PUBLIC repository (name, first
// and last commit in the season, commit count), PRIVATE repositories folded
// into a single count, and the season's weekly commit totals. No author, no
// message, no private name ever leaves this script (forge #3: privacy is
// counts-only).
//
// Run locally, never in CI:
//   set -a; source /Users/jnxmas/dev/locki-io.github.io/.env.platforms; set +a
//   node scripts/grow-seed-pulse.mjs
//
// A missing GITHUB_PAT_TOKEN stops the script — it never hunts for another.

import { writeFileSync, mkdirSync } from 'node:fs';

const TOKEN = process.env.GITHUB_PAT_TOKEN;
if (!TOKEN) { console.error('GITHUB_PAT_TOKEN missing — STOP'); process.exit(1); }
const SEASON = { from: '2023-09-01', to: '2024-04-30' };
const H = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

async function page(url) {
  const out = [];
  for (let p = 1; p < 40; p++) {
    const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${p}`, { headers: H });
    if (r.status === 409) return out;                       // an empty repository
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const j = await r.json();
    out.push(...j);
    if (j.length < 100) break;
  }
  return out;
}

const weekStart = (iso) => { const d = new Date(iso); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); };

const repos = (await page('https://api.github.com/user/repos?affiliation=owner,organization_member&sort=pushed'))
  .filter((r) => r.created_at < SEASON.to && r.pushed_at > SEASON.from);

const pub = [], priv = { repos: 0, commits: 0 }, weeks = {};
for (const r of repos) {
  const commits = await page(`https://api.github.com/repos/${r.full_name}/commits?since=${SEASON.from}T00:00:00Z&until=${SEASON.to}T23:59:59Z`);
  if (!commits.length) continue;
  const dates = commits.map((c) => c.commit.committer.date.slice(0, 10)).sort();
  for (const d of dates) weeks[weekStart(d)] = (weeks[weekStart(d)] || 0) + 1;
  if (r.private) { priv.repos++; priv.commits += commits.length; }
  else pub.push({ name: r.name, born: dates[0], last: dates[dates.length - 1], commits: commits.length });
  process.stderr.write(`${r.private ? 'private' : r.name.padEnd(24)} ${String(commits.length).padStart(4)} commits  ${dates[0]} → ${dates[dates.length - 1]}\n`);
}
pub.sort((a, b) => a.born.localeCompare(b.born));
const out = {
  season: SEASON, generated: new Date().toISOString().slice(0, 10), rule: 'counts only; private repositories folded; no author, no message',
  repos: pub, private: priv,
  weeks: Object.keys(weeks).sort().map((w) => ({ start: w, commits: weeks[w] })),
  total: pub.reduce((a, r) => a + r.commits, 0) + priv.commits,
};
mkdirSync('public/pulse', { recursive: true });
writeFileSync('public/pulse/seed.json', JSON.stringify(out, null, 2) + '\n');
console.log(`public/pulse/seed.json — ${pub.length} public + ${priv.repos} private repositories, ${out.total} commits, ${out.weeks.length} weeks`);
