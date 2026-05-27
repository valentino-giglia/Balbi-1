const express = require('express');
const router = express.Router();
const { getCalendar, getSheets, CALENDAR_ID, SHEET_ID } = require('../config/google');

router.get('/test', async (req, res) => {
  const result = { calendar: null, sheets: null };

  try {
    const calendar = await getCalendar();
    const r = await calendar.calendars.get({ calendarId: CALENDAR_ID });
    result.calendar = { ok: true, summary: r.data.summary, calendarId: CALENDAR_ID };
  } catch (err) {
    result.calendar = { ok: false, error: err.message };
  }

  try {
    const sheets = await getSheets();
    const r = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID, fields: 'sheets.properties.title' });
    result.sheets = { ok: true, tabs: r.data.sheets.map(s => s.properties.title), sheetId: SHEET_ID };
  } catch (err) {
    result.sheets = { ok: false, error: err.message };
  }

  res.json(result);
});

module.exports = router;
