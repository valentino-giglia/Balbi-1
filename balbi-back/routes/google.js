const express = require('express');
const router = express.Router();
const { getCalendar, getSheets, CALENDAR_ID, SHEET_ID } = require('../config/google');

router.get('/test', async (req, res) => {
  const result = { debug: {}, calendar: null, sheets: null };

  // ── Diagnostico del JSON ────────────────────────────────────────
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return res.json({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON no configurado' });
  }

  result.debug.rawLength = raw.length;
  result.debug.rawFirst30 = raw.substring(0, 30);

  let creds;
  try {
    creds = JSON.parse(raw);
    result.debug.parsedWith = 'direct';
  } catch {
    try {
      creds = JSON.parse(raw.replace(/\n/g, '\\n'));
      result.debug.parsedWith = 'newline-fix';
    } catch (e2) {
      return res.json({ error: 'JSON invalido', detail: e2.message, debug: result.debug });
    }
  }

  result.debug.clientEmail = creds.client_email || 'FALTA';
  result.debug.hasPrivateKey = !!creds.private_key;

  if (creds.private_key) {
    const rawKey = creds.private_key;
    const fixedKey = rawKey.replace(/\\n/g, '\n');
    result.debug.keyChangedByFix = rawKey !== fixedKey;
    result.debug.keyHasRealNewlines = fixedKey.includes('\n');
    result.debug.keyLineCount = fixedKey.split('\n').length;
    result.debug.keyHeader = fixedKey.substring(0, 27); // solo "-----BEGIN PRIVATE KEY-----"
  }

  // ── Calendar ────────────────────────────────────────────────────
  try {
    const calendar = await getCalendar();
    const r = await calendar.calendars.get({ calendarId: CALENDAR_ID });
    result.calendar = { ok: true, summary: r.data.summary };
  } catch (err) {
    result.calendar = { ok: false, error: err.message };
  }

  // ── Sheets ──────────────────────────────────────────────────────
  try {
    const sheets = await getSheets();
    const r = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties.title' });
    result.sheets = { ok: true, tabs: r.data.sheets.map(s => s.properties.title) };
  } catch (err) {
    result.sheets = { ok: false, error: err.message };
  }

  res.json(result);
});

module.exports = router;
