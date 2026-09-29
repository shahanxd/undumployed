// Build an iCalendar file for deadlines. All-day events with a 7-day and 1-day reminder.

function pad(n) { return String(n).padStart(2, '0'); }
function ymd(d) { return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`; }
function stamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
function escapeText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function fold(line) {
  // RFC 5545: lines max 75 octets; continuation lines start with a space.
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = '';
  for (const ch of line) {
    if (new TextEncoder().encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** items: opportunities with .date (exact deadlines only are included). */
export function icsForDeadlines(items, calName = 'undumployed deadlines') {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//undumployed//deadlines//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calName)}`];
  const now = stamp();
  for (const o of items) {
    if (!o.date) continue;
    const end = new Date(o.date); end.setDate(end.getDate() + 1);
    const desc = [o.who ? `Who: ${o.who}` : '', o.stipend ? `Funding: ${o.stipend}` : '', o.deadline ? `Deadline: ${o.deadline}` : '', o.applyUrl || '', 'Always confirm on the official page.'].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT',
      `UID:${o.id.replace(/[^A-Za-z0-9#./_-]/g, '')}@undumployed`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${ymd(o.date)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:${escapeText(`Deadline: ${o.name}`)}`,
      `DESCRIPTION:${escapeText(desc)}`,
      o.applyUrl ? `URL:${o.applyUrl}` : '',
      'BEGIN:VALARM', 'TRIGGER:-P7D', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(`${o.name} closes in a week`)}`, 'END:VALARM',
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(`${o.name} closes tomorrow`)}`, 'END:VALARM',
      'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).map(fold).join('\r\n') + '\r\n';
}

export function download(filename, text, type = 'text/calendar;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}
