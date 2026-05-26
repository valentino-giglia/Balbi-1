const { google } = require('googleapis');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ||
  '9ff2aa39daa03cb2d81fc552fe844c13a0b21e13862a32ff85be5372ab7b095f@group.calendar.google.com';

const SHEET_ID = process.env.GOOGLE_SHEET_ID ||
  '1QS8GtFG6-EISoIwQ-V9WO-_0CoOLP4lw3BJukLh-oPI';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets'
];

function getAuthClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON no está configurado');
  }
  const credentials = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
}

async function getCalendar() {
  const auth = getAuthClient();
  return google.calendar({ version: 'v3', auth });
}

async function getSheets() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

module.exports = { getCalendar, getSheets, CALENDAR_ID, SHEET_ID };
