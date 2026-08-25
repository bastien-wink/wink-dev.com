#!/usr/bin/env node
// Régénère index.html (sections marquées) et cv-print.html à partir de data/cv.json.
// Usage: node build/build.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cv = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cv.json'), 'utf8'));

const FR_MONTHS = ['', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const EN_MONTHS = ['', 'Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function fmt(job, iso, months, capFirst) {
  const [y, m] = iso.split('-').map(Number);
  const label = job.yearOnly ? `${y}` : `${months[m]} ${y}`;
  return capFirst ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}

function dateRangeSite(job, lang) {
  const months = lang === 'fr' ? FR_MONTHS : EN_MONTHS;
  const start = fmt(job, job.start, months, true);
  if (job.current) return `${start} / ${lang === 'fr' ? 'Maintenant' : 'Now'}`;
  if (job.start === job.end) return start;
  const end = fmt(job, job.end, months, true);
  return `${start} / ${end}`;
}

function durationLabel(months) {
  if (months <= 0) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y) parts.push(`${y} an${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mois`);
  return parts.join(' ');
}

function whenPrint(job) {
  const start = fmt(job, job.start, FR_MONTHS, true);
  if (job.start === job.end) return `<b>${start}</b>`;

  const now = new Date();
  const endIso = job.current ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` : job.end;
  const end = job.current ? "Aujourd'hui" : fmt(job, job.end, FR_MONTHS, true);

  const [sy, sm] = job.start.split('-').map(Number);
  const [ey, em] = endIso.split('-').map(Number);
  const dur = durationLabel((ey - sy) * 12 + (em - sm) + 1);

  return `<b>${start}</b> - ${end}${dur ? ` · ${dur}` : ''}`;
}

// Job/skill/education text fields are plain text but may carry an intentional <a> link
// (e.g. IOVOX, HPJ Solutions bullets); only escape bare & so entities stay well-formed.
function esc(s) {
  return s.replace(/&(?!amp;|#)/g, '&amp;');
}

// ---------- index.html: profile ----------
function renderProfile() {
  const I = '                                                '; // 48 spaces
  const P = '                                            '; // 44 spaces
  const fr = cv.profile.fr.map(p => `${I}${p}`).join(`\n${I}<br /><br />\n`);
  const en = cv.profile.en.map(p => `${I}${p}`).join(`\n${I}<br /><br />\n`);
  return `${P}<p class="lang-fr">\n${fr}\n${P}</p>\n${P}<p class="lang-en">\n${en}\n${P}</p>`;
}

// ---------- index.html: skills ----------
function renderSkillsSite() {
  const B = '                                    '; // 36 spaces
  const col = (skills) => skills.map(s => {
    const label = s.fr === s.en
      ? esc(s.fr)
      : `<span class="lang-fr">${esc(s.fr)}</span><span class="lang-en">${esc(s.en)}</span>`;
    return `${B}    <div class="skill" data-level="${s.level}">\n${B}        <label>${label}</label>\n${B}    </div>`;
  }).join('\n');
  return `${B}<div class="span6 holder">\n${col(cv.skills_site[0])}\n${B}</div>\n${B}<div class="span6 holder">\n${col(cv.skills_site[1])}\n${B}</div>`;
}

// ---------- index.html: experiences ----------
function renderExperiencesSite() {
  return cv.jobs.map(job => {
    const dateFr = dateRangeSite(job, 'fr');
    const dateEn = dateRangeSite(job, 'en');
    const locLine = job.loc_fr === job.loc_en
      ? `<h4 class="location">${esc(job.loc_fr)}</h4>`
      : `<h4 class="location"><span class="lang-fr">${esc(job.loc_fr)}</span><span class="lang-en">${esc(job.loc_en)}</span></h4>`;
    const companyLine = job.company_fr === job.company_en
      ? `<h3>${esc(job.company_fr)}</h3>`
      : `<h3><span class="lang-fr">${esc(job.company_fr)}</span><span class="lang-en">${esc(job.company_en)}</span></h3>`;
    const titleLine = job.title_fr === job.title_en
      ? `<h4>${esc(job.title_fr)}</h4>`
      : `<h4><span class="lang-fr">${esc(job.title_fr)}</span><span class="lang-en">${esc(job.title_en)}</span></h4>`;
    const bulletLines = [];
    for (const b of job.bullets) {
      if (b.fr === b.en) {
        bulletLines.push(`                                                        <li>${esc(b.fr)}</li>`);
      } else {
        bulletLines.push(`                                                        <li class="lang-fr">${esc(b.fr)}</li>`);
        bulletLines.push(`                                                        <li class="lang-en">${esc(b.en)}</li>`);
      }
    }
    const extra = job.extra_fr ? `
                                                    <p class="lang-fr">
                                                        ${job.extra_fr}
                                                    </p>
                                                    <p class="lang-en">
                                                        ${job.extra_en}
                                                    </p>` : '';
    return `                                        <div class="exp-item">
                                            <div class="exp-holder">
                                                <div class="head">
                                                    <div class="date-range"><span class="lang-fr">${dateFr}</span><span class="lang-en">${dateEn}</span></div>
                                                    ${locLine}
                                                    ${companyLine}
                                                    ${titleLine}
                                                </div>
                                                <div class="body">
                                                    <ul>
${bulletLines.join('\n')}
                                                    </ul>${extra}
                                                </div>
                                            </div>
                                        </div>`;
  }).join('\n');
}

function replaceBetween(html, startMarker, endMarker, content) {
  const re = new RegExp(`(${startMarker}\\n)([\\s\\S]*?)(\\n\\s*${endMarker})`);
  if (!re.test(html)) throw new Error(`markers not found: ${startMarker} / ${endMarker}`);
  return html.replace(re, (_, s, _old, e) => `${s}${content}${e}`);
}

function buildIndex() {
  const indexPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  html = replaceBetween(html, '<!-- cv:profile:start -->', '<!-- cv:profile:end -->', renderProfile());
  html = replaceBetween(html, '<!-- cv:skills:start -->', '<!-- cv:skills:end -->', renderSkillsSite());
  html = replaceBetween(html, '<!-- cv:experiences:start -->', '<!-- cv:experiences:end -->', renderExperiencesSite());

  fs.writeFileSync(indexPath, html);
  console.log('index.html regenerated');
}

// ---------- cv-print.html ----------
function renderJobsPrint() {
  return cv.jobs.filter(j => j.print).map(job => {
    const src = job.print_bullets !== undefined ? job.print_bullets : job.bullets.map(b => b.fr);
    const items = src.map(esc);
    const ul = items.length
      ? `\n  <ul>\n${items.map(b => `    <li>${b}</li>`).join('\n')}\n  </ul>`
      : '';
    return `<div class="job">
  <div class="head">
    <div class="co">${esc(job.company_fr)}</div>
    <div class="when">${whenPrint(job)}</div>
  </div>
  <div class="pos">${esc(job.title_fr)} <span class="loc">· ${esc(job.loc_fr)}</span></div>${ul}
</div>`;
  }).join('\n\n');
}

function renderSkillsPrint() {
  return cv.skills_print.map(s => `  <tr><td class="k">${esc(s.k)}</td><td class="v">${esc(s.v)}</td></tr>`).join('\n');
}

function renderEducationPrint() {
  return cv.education.map(e => {
    const org = e.org || e.org_fr;
    const sub = e.years;
    const desc = e.print_fr || e.desc_fr;
    return `      <div class="edu">
        <div class="t">${esc(org)} - ${esc(sub)}</div>
        <div class="s">${desc}</div>
      </div>`;
  }).join('\n');
}

function renderLanguagesPrint() {
  const langs = cv.languages.map(l => `      <div class="kv"><b>${esc(l.name)}</b> - ${esc(l.level)}</div>`).join('\n');
  const certs = cv.certifications.map(c => `      <div class="kv" style="margin-top:2.5mm"><b>${esc(c)}</b></div>`).join('\n');
  return `${langs}\n${certs}`;
}

function buildPrint() {
  const css = fs.readFileSync(path.join(ROOT, 'build/templates/print.css'), 'utf8');
  const m = cv.meta;
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${m.name} - CV</title>
<style>
${css}
</style>
</head>
<body>

<div class="masthead">
  <img class="photo" src="images/avatar2.jpg" alt="${m.name}" />
  <div class="head-block">
    <div class="name">${m.name}</div>
    <div class="role">${m.role_print}</div>
  </div>
  <div class="contact">
    <div>${m.email}</div>
    <div>${m.location}<span class="sep">|</span>Remote ou sur site</div>
    <div>${m.website}<span class="sep">|</span>${m.linkedin}</div>
  </div>
</div>

<h2>Profil</h2>
<p class="profile" style="margin:0">
${cv.profile.fr.join('<br><br>\n')}
</p>

<h2>Compétences</h2>
<table class="skills">
${renderSkillsPrint()}
</table>

<h2>Expérience</h2>

${renderJobsPrint()}

<table class="cols">
  <tr>
    <td class="left">
      <h2 style="margin-top:3mm">Formation</h2>
${renderEducationPrint()}
    </td>
    <td>
      <h2 style="margin-top:3mm">Langues &amp; certification</h2>
${renderLanguagesPrint()}
    </td>
  </tr>
</table>

</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'cv-print.html'), html);
  console.log('cv-print.html regenerated');
}

buildIndex();
buildPrint();
