/**
 * GOOGLE APPS SCRIPT CODE (SINGLE MASTER SHEET)
 *
 * All events write to the SAME Google Spreadsheet.
 *
 * Setup:
 * 1. Create ONE Google Sheet with headers in row 1:
 *    Timestamp, Full Name, Email, Phone, College, Year, Registration ID, Payment ID, PaymentLink, Team Name, Member 1, Member 2, Member 3, Member 4, Accommodation
 * 2. Paste the spreadsheet ID in MASTER_SPREADSHEET_ID.
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone).
 * 4. Use deployed URL as GOOGLE_SCRIPT_URL in frontend constants.ts.
 */

const DEFAULT_SHEET_NAME = 'Sheet1';
const EVENT_DATE_LABEL = 'March 27 - 28, 2026';
const USER_REGISTRATIONS_CACHE_PREFIX = 'user_registrations:';
const USER_REGISTRATIONS_CACHE_TTL_SECONDS = 1800;
const ADMIN_REGISTRATIONS_CACHE_KEY = 'admin_all_registrations';
const ADMIN_REGISTRATIONS_CACHE_TTL_SECONDS = 1800;
const USER_INDEX_PROPERTY_PREFIX = 'user_index:';

const ADMIN_ALLOWED_EMAILS = [
  'vaibhav2k26jcet@gmail.com',
  'srujanmirji10@gmail.com',
  'jcetvaibhav@gmail.com',
  'prajwaljinagi63@gmail.com',
  'dharwadzishan@gmail.com',
  'sachitsarangamath44@gmail.com',
  'vishal.ishwar.ponaji@gmail.com'
];

const MASTER_SPREADSHEET_ID = '18_DvVPNHExzkiRZ9MLQCL-NKvxd538BynEeuqj34Jik';
// Create a folder in Google Drive and paste the ID here
const REGISTRATIONS_FOLDER_ID = '1LZ0g7sGct4QsU6yp2WzkXqVtaVKhy97r';

const EVENT_ID_TO_TITLE = {
  e1: 'Netrtva Tantra (Best Manager)',
  e2: 'Prachara Tantra (Marketing)',
  e3: 'Kosh Tantra (Finance)'
};

const EVENT_ID_TO_DATE = {
  e1: 'March 27 - 28, 2026',
  e2: 'March 27 - 28, 2026',
  e3: 'March 27 - 28, 2026'
};

const EVENT_TITLE_TO_ID = {
  netrtvatantrabestmanager: 'e1',
  pracharatantramarketing: 'e2',
  koshtantrafinance: 'e3'
};

function doGet(e) {
  try {
    const action = normalizeString_((e && e.parameter && e.parameter.action) || '').toLowerCase();
    const callback = (e && e.parameter && e.parameter.callback) || '';

    if (action === 'getallregistrations') {
      const adminEmail = normalizeString_((e && e.parameter && e.parameter.adminEmail) || '').toLowerCase();
      const forceRefresh = isTruthy_((e && e.parameter && e.parameter.forceRefresh) || '');
      if (!isAdminAllowed_(adminEmail)) {
        return createJSONOutput_({ status: 'error', message: 'Unauthorized admin access.' }, callback);
      }

      if (!forceRefresh) {
        const cachedAdminRows = readScriptCacheJSON_(ADMIN_REGISTRATIONS_CACHE_KEY);
        if (cachedAdminRows && Array.isArray(cachedAdminRows.data)) {
          return createJSONOutput_({ status: 'success', data: cachedAdminRows.data }, callback);
        }
      }

      const sheet = getSheet_(MASTER_SPREADSHEET_ID, DEFAULT_SHEET_NAME);
      const lastRow = sheet.getLastRow();
      const allRows = [];

      if (lastRow >= 2) {
        const rows = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
        rows.forEach(function (row) {
          allRows.push({
            timestamp: formatTimestamp_(row[0]),
            fullName: normalizeString_(row[1]),
            email: normalizeString_(row[2]).toLowerCase(),
            phone: normalizeString_(row[3]),
            college: normalizeString_(row[4]),
            year: normalizeString_(row[5]),
            registrationId: normalizeString_(row[6]),
            paymentId: normalizeString_(row[7]),
            paymentLink: normalizeString_(row[8]),
            teamName: normalizeString_(row[9]),
            member1Name: normalizeString_(row[10]),
            member2Name: normalizeString_(row[11]),
            member3Name: normalizeString_(row[12]),
            member4Name: normalizeString_(row[13]),
            accommodationRequired: normalizeString_(row[14]),
            idFileUrl: normalizeString_(row[15] || ''),
            // For backward compatibility with any admin dashboard logic expecting these
            eventTitle: 'MBA Fest Registration',
            eventDate: EVENT_DATE_LABEL
          });
        });
      }

      allRows.sort(function (a, b) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      writeScriptCacheJSON_(
        ADMIN_REGISTRATIONS_CACHE_KEY,
        { data: allRows },
        ADMIN_REGISTRATIONS_CACHE_TTL_SECONDS
      );

      return createJSONOutput_({ status: 'success', data: allRows }, callback);
    }

    if (action !== 'getregistrations') {
      return createJSONOutput_({ status: 'success', message: 'Server is running' }, callback);
    }

    const email = normalizeString_((e && e.parameter && e.parameter.email) || '').toLowerCase();
    const forceRefresh = isTruthy_((e && e.parameter && e.parameter.forceRefresh) || '');
    if (!email) {
      return createJSONOutput_({ status: 'error', message: 'Email is required.' }, callback);
    }

    if (!forceRefresh) {
      const indexedRegistrations = readUserRegistrationsIndex_(email);
      if (indexedRegistrations) {
        return createJSONOutput_({ status: 'success', data: indexedRegistrations }, callback);
      }
    }

    const userRegistrationsCacheKey = getUserRegistrationsCacheKey_(email);
    if (!forceRefresh) {
      const cachedUserRows = readScriptCacheJSON_(userRegistrationsCacheKey);
      if (cachedUserRows && Array.isArray(cachedUserRows.data)) {
        return createJSONOutput_({ status: 'success', data: cachedUserRows.data }, callback);
      }
    }

    const sheet = getSheet_(MASTER_SPREADSHEET_ID, DEFAULT_SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const allRegistrations = [];

    if (lastRow >= 2) {
      const rows = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
      rows.forEach(function (row) {
        if (normalizeString_(row[2]).toLowerCase() === email) {
          const events = [
            { id: 'e1', title: EVENT_ID_TO_TITLE['e1'] },
            { id: 'e2', title: EVENT_ID_TO_TITLE['e2'] },
            { id: 'e3', title: EVENT_ID_TO_TITLE['e3'] }
          ];
          events.forEach(function (evt) {
            allRegistrations.push({
              id: evt.id,
              title: evt.title,
              date: EVENT_DATE_LABEL,
              registrationId: normalizeString_(row[6]),
              timestamp: formatTimestamp_(row[0])
            });
          });
        }
      });
    }// (Registration fetching finished)

    const deduped = dedupeRegistrations_(allRegistrations);
    writeUserRegistrationsIndex_(email, deduped);
    writeScriptCacheJSON_(
      userRegistrationsCacheKey,
      { data: deduped },
      USER_REGISTRATIONS_CACHE_TTL_SECONDS
    );
    return createJSONOutput_({ status: 'success', data: deduped }, callback);
  } catch (error) {
    return createJSONOutput_({ status: 'error', message: error.toString() }, callback || '');
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJSONOutput_({ status: 'error', message: 'Missing request body.' });
    }

    const data = JSON.parse(e.postData.contents);
    const action = normalizeString_(data.action || 'register').toLowerCase();

    if (action !== 'register') {
      return createJSONOutput_({ status: 'error', message: 'Invalid action.' });
    }

    const email = normalizeString_(data.email).toLowerCase();

    // OPTIMIZATION 1: Check cache BEFORE opening the spreadsheet (10x faster)
    const existingCache = readUserRegistrationsIndex_(email);
    if (existingCache && existingCache.length > 0) {
      return createJSONOutput_({
        status: 'error',
        message: 'You are already registered with this email for the MBA Fest.'
      });
    }

    const selectedEvents = normalizeEvents_(data);
    if (!email || selectedEvents.length === 0) {
      return createJSONOutput_({ status: 'error', message: 'Email and at least one event are required.' });
    }

    const sheet = getSheet_(MASTER_SPREADSHEET_ID, DEFAULT_SHEET_NAME);

    // OPTIMIZATION 2: Fallback check in sheet only if cache was empty
    const lastRow = sheet.getLastRow();
    const alreadyRegistered = hasEmailInSheet_(sheet, lastRow, email);
    if (alreadyRegistered) {
      return createJSONOutput_({
        status: 'error',
        message: 'You are already registered for the MBA Fest.'
      });
    }

    const paymentId = normalizeString_(data.paymentId) || '';
    const paymentLink = paymentId ? 'https://merchant.cashfree.com/merchant/pg/orders/' + paymentId : '';

    // Handle File Upload to Google Drive (Slow operation)
    let fileUrl = '';
    if (data.collegeIdFile && data.collegeIdFile.base64) {
      fileUrl = saveFileToDrive_(data.collegeIdFile, data.registrationId || data.email);
    }

    const row = [
      new Date(),
      normalizeString_(data.fullName),
      email,
      "'" + normalizeString_(data.phone),
      normalizeString_(data.college),
      normalizeString_(data.year),
      normalizeString_(data.registrationId) || ('RNTR-MBA-' + Math.floor(1000 + Math.random() * 9000)),
      paymentId,
      paymentLink,
      normalizeString_(data.teamName),
      normalizeString_(data.member1Name),
      normalizeString_(data.member2Name),
      normalizeString_(data.member3Name),
      normalizeString_(data.member4Name),
      normalizeString_(data.accommodationRequired),
      fileUrl // Link to the file in Google Drive
    ];

    // OPTIMIZATION 3: Use appendRow for speed and atomicity
    sheet.appendRow(row);

    const insertedEvents = [
      { id: 'e1', title: EVENT_ID_TO_TITLE['e1'], date: EVENT_DATE_LABEL },
      { id: 'e2', title: EVENT_ID_TO_TITLE['e2'], date: EVENT_DATE_LABEL },
      { id: 'e3', title: EVENT_ID_TO_TITLE['e3'], date: EVENT_DATE_LABEL }
    ];

    // Update indexes and send email
    updateUserRegistrationsIndex_(email, insertedEvents);
    clearRegistrationsCaches_(email);
    sendConfirmationEmail_(data, insertedEvents, []);

    return createJSONOutput_({ status: 'success', message: 'Registration successful for MBA Fest.' });
  } catch (error) {
    return createJSONOutput_({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function normalizeEvents_(data) {
  const normalized = [];

  if (Array.isArray(data.selectedEvents)) {
    data.selectedEvents.forEach(function (item) {
      if (typeof item === 'string') {
        normalized.push({ id: '', title: normalizeString_(item) });
        return;
      }

      if (item && typeof item === 'object') {
        normalized.push({
          id: normalizeString_(item.id || item.eventId || item.selectedEventId),
          title: normalizeString_(item.title || item.name || item.selectedEvent || item.eventTitle)
        });
      }
    });
  }

  const fallbackTitle = normalizeString_(data.selectedEvent || data.selectedEventTitle);
  const fallbackId = normalizeString_(data.selectedEventId || data.eventId);
  if (fallbackTitle || fallbackId) {
    normalized.push({ id: fallbackId, title: fallbackTitle });
  }

  const seen = {};
  const unique = [];
  normalized.forEach(function (eventItem) {
    const key = (eventItem.id ? 'id:' + eventItem.id.toLowerCase() : 'title:' + normalizeKey_(eventItem.title));
    if (!eventItem.id && !eventItem.title) {
      return;
    }
    if (seen[key]) {
      return;
    }
    seen[key] = true;
    unique.push(eventItem);
  });

  return unique;
}

function resolveEvent_(eventEntry) {
  const inputId = normalizeString_(eventEntry.id).toLowerCase();
  const inputTitle = normalizeString_(eventEntry.title);
  const mappedByTitle = inputTitle ? EVENT_TITLE_TO_ID[normalizeKey_(inputTitle)] : '';
  const eventId = inputId || mappedByTitle;

  if (!eventId || !EVENT_ID_TO_TITLE[eventId]) {
    throw new Error('Invalid event: ' + (inputTitle || inputId || 'unknown'));
  }

  return {
    eventId: eventId,
    eventTitle: inputTitle || EVENT_ID_TO_TITLE[eventId] || eventId
  };
}

function getSheet_(spreadsheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet "' + sheetName + '" not found in spreadsheet ' + spreadsheetId);
  }
  return sheet;
}



function isAdminAllowed_(adminEmail) {
  if (!adminEmail) {
    return false;
  }

  const normalizedAllowed = ADMIN_ALLOWED_EMAILS.map(function (email) {
    return normalizeString_(email).toLowerCase();
  });

  return normalizedAllowed.indexOf(adminEmail) !== -1;
}

function formatTimestamp_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  return normalizeString_(value);
}

function dedupeRegistrations_(rows) {
  const seen = {};
  const deduped = [];

  rows.forEach(function (entry) {
    const key = (entry.id || '') + '|' + normalizeKey_(entry.title || '');
    if (seen[key]) {
      return;
    }
    seen[key] = true;
    deduped.push(entry);
  });

  return deduped;
}

function getUserIndexPropertyKey_(email) {
  return USER_INDEX_PROPERTY_PREFIX + normalizeString_(email).toLowerCase();
}

function readUserRegistrationsIndex_(email) {
  const key = getUserIndexPropertyKey_(email);
  if (!key) {
    return null;
  }

  try {
    const raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return dedupeRegistrations_(parsed.map(function (entry) {
      return {
        id: normalizeString_(entry && entry.id),
        title: normalizeString_(entry && entry.title),
        date: normalizeString_(entry && entry.date)
      };
    })).filter(function (entry) {
      return !!entry.id || !!entry.title;
    });
  } catch (error) {
    console.log('User index read error: ' + error);
    return null;
  }
}

function writeUserRegistrationsIndex_(email, rows) {
  const key = getUserIndexPropertyKey_(email);
  if (!key) {
    return;
  }

  try {
    const normalizedRows = dedupeRegistrations_((rows || []).map(function (entry) {
      return {
        id: normalizeString_(entry && entry.id),
        title: normalizeString_(entry && entry.title),
        date: normalizeString_(entry && entry.date)
      };
    })).filter(function (entry) {
      return !!entry.id || !!entry.title;
    });

    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(normalizedRows));
  } catch (error) {
    console.log('User index write error: ' + error);
  }
}

function updateUserRegistrationsIndex_(email, insertedEvents) {
  const existing = readUserRegistrationsIndex_(email) || [];
  const normalizedInserted = (insertedEvents || []).map(function (eventItem) {
    const eventId = normalizeString_(eventItem && eventItem.id).toLowerCase();
    return {
      id: eventId,
      title: normalizeString_(eventItem && eventItem.title) || EVENT_ID_TO_TITLE[eventId] || eventId,
      date: normalizeString_(eventItem && eventItem.date) || EVENT_ID_TO_DATE[eventId] || EVENT_DATE_LABEL
    };
  });

  writeUserRegistrationsIndex_(email, existing.concat(normalizedInserted));
}

function getUserRegistrationsCacheKey_(email) {
  return USER_REGISTRATIONS_CACHE_PREFIX + normalizeString_(email).toLowerCase();
}

function readScriptCacheJSON_(key) {
  if (!key) {
    return null;
  }

  try {
    const cache = CacheService.getScriptCache();
    const raw = cache.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.log('Cache read error: ' + error);
    return null;
  }
}

function writeScriptCacheJSON_(key, value, ttlSeconds) {
  if (!key) {
    return;
  }

  try {
    CacheService.getScriptCache().put(key, JSON.stringify(value), ttlSeconds);
  } catch (error) {
    console.log('Cache write error: ' + error);
  }
}

function clearRegistrationsCaches_(email) {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(getUserRegistrationsCacheKey_(email));
    cache.remove(ADMIN_REGISTRATIONS_CACHE_KEY);
  } catch (error) {
    console.log('Cache clear error: ' + error);
  }
}

// getFirstMatchingRegistrationRow_ removed as it is legacy multi-sheet logic

function hasEmailInSheet_(sheet, lastRow, email) {
  if (lastRow < 2) {
    return false;
  }

  const data = sheet.getRange(2, 3, lastRow - 1, 1).getValues(); // Email is col 3
  for (var i = 0; i < data.length; i++) {
    if (normalizeString_(data[i][0]).toLowerCase() === email) {
      return true;
    }
  }
  return false;
}

function rebuildAllUserIndexes_() {
  const registrationsByEmail = {};
  const sheet = getSheet_(MASTER_SPREADSHEET_ID, DEFAULT_SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  rows.forEach(function (row) {
    const email = normalizeString_(row[2]).toLowerCase();
    if (!email) {
      return;
    }

    if (!registrationsByEmail[email]) {
      registrationsByEmail[email] = [];
    }

    const events = [
      { id: 'e1', title: EVENT_ID_TO_TITLE['e1'], date: EVENT_DATE_LABEL },
      { id: 'e2', title: EVENT_ID_TO_TITLE['e2'], date: EVENT_DATE_LABEL },
      { id: 'e3', title: EVENT_ID_TO_TITLE['e3'], date: EVENT_DATE_LABEL }
    ];

    events.forEach(function (evt) {
      registrationsByEmail[email].push(evt);
    });
  });

  Object.keys(registrationsByEmail).forEach(function (email) {
    writeUserRegistrationsIndex_(email, registrationsByEmail[email]);
  });
}

function createJSONOutput_(payload, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeString_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeKey_(value) {
  return normalizeString_(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isTruthy_(value) {
  const normalized = normalizeString_(value).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function sendConfirmationEmail_(data, eventTitles, skippedEvents) {
  try {
    const email = normalizeString_(data.email);
    if (!email) {
      return;
    }

    const fullName = normalizeString_(data.fullName) || 'Participant';
    const regId = normalizeString_(data.registrationId) || '';
    const paymentId = normalizeString_(data.paymentId) || '';
    const phone = normalizeString_(data.phone) || '';
    const college = normalizeString_(data.college) || '';

    const subject = "🎆 Access Granted: You're Officially In for Ranatantra MBA Fest!";

    // Build event cards HTML
    var eventCardsHtml = '';
    eventTitles.forEach(function (eventItem) {
      var title = typeof eventItem === 'string' ? eventItem : eventItem.title;
      var date = typeof eventItem === 'string' ? EVENT_DATE_LABEL : (eventItem.date || EVENT_DATE_LABEL);
      eventCardsHtml += '<tr><td style="padding:6px 0;">'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a2e;border:1px solid rgba(255,0,85,0.25);border-radius:12px;border-left:4px solid #FF0055;">'
        + '<tr><td style="padding:16px 20px;">'
        + '<table width="100%" cellpadding="0" cellspacing="0"><tr>'
        + '<td style="font-size:16px;font-weight:700;color:#ffffff;font-family:\'Segoe UI\',Arial,sans-serif;">' + title + '</td>'
        + '<td align="right" style="font-size:12px;color:#00FFFF;font-weight:600;font-family:\'Segoe UI\',Arial,sans-serif;white-space:nowrap;">📅 ' + date + '</td>'
        + '</tr></table>'
        + '</td></tr></table>'
        + '</td></tr>';
    });

    // Build skipped events HTML (already registered)
    var skippedHtml = '';
    if (skippedEvents && skippedEvents.length > 0) {
      skippedHtml += '<tr><td style="padding:12px 32px 8px;">'
        + '<p style="margin:0 0 10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;font-weight:700;">✅ ALREADY REGISTERED</p>';
      skippedEvents.forEach(function (title) {
        skippedHtml += '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px;background:#0f0020;border:1px solid rgba(255,255,255,0.06);border-radius:10px;border-left:4px solid #22c55e;">'
          + '<tr><td style="padding:12px 16px;font-size:14px;color:#999;font-family:\'Segoe UI\',Arial,sans-serif;">'
          + title + ' <span style="font-size:11px;color:#22c55e;font-weight:600;">(already confirmed)</span>'
          + '</td></tr></table>';
      });
      skippedHtml += '</td></tr>';
    }

    // Build info rows
    var infoRowsHtml = '';
    if (regId) {
      infoRowsHtml += '<tr>'
        + '<td style="padding:10px 16px;font-size:13px;color:#999;font-family:\'Segoe UI\',Arial,sans-serif;border-bottom:1px solid rgba(255,255,255,0.05);">Registration ID</td>'
        + '<td style="padding:10px 16px;font-size:13px;color:#FF0055;font-weight:700;font-family:\'Courier New\',monospace;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">' + regId + '</td>'
        + '</tr>';
    }
    if (paymentId) {
      infoRowsHtml += '<tr>'
        + '<td style="padding:10px 16px;font-size:13px;color:#999;font-family:\'Segoe UI\',Arial,sans-serif;border-bottom:1px solid rgba(255,255,255,0.05);">Payment ID</td>'
        + '<td style="padding:10px 16px;font-size:13px;color:#22c55e;font-weight:600;font-family:\'Courier New\',monospace;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">'
        + '<a href="https://merchant.cashfree.com/merchant/pg/orders/' + paymentId + '" style="color:#22c55e;text-decoration:none;">' + paymentId + ' 🔗</a>'
        + '</td>'
        + '</tr>';
    }
    if (college) {
      infoRowsHtml += '<tr>'
        + '<td style="padding:10px 16px;font-size:13px;color:#999;font-family:\'Segoe UI\',Arial,sans-serif;border-bottom:1px solid rgba(255,255,255,0.05);">College</td>'
        + '<td style="padding:10px 16px;font-size:13px;color:#e2e2e2;font-weight:500;font-family:\'Segoe UI\',Arial,sans-serif;border-bottom:1px solid rgba(255,255,255,0.05);text-align:right;">' + college + '</td>'
        + '</tr>';
    }
    if (phone) {
      infoRowsHtml += '<tr>'
        + '<td style="padding:10px 16px;font-size:13px;color:#999;font-family:\'Segoe UI\',Arial,sans-serif;">Phone</td>'
        + '<td style="padding:10px 16px;font-size:13px;color:#e2e2e2;font-weight:500;font-family:\'Segoe UI\',Arial,sans-serif;text-align:right;">' + phone + '</td>'
        + '</tr>';
    }

    var passId = regId || ('PASS-' + Utilities.base64Encode(Utilities.newBlob(email).getBytes()).substring(0, 8).toUpperCase());
    var eventNames = eventTitles.map(function (e) { return typeof e === 'string' ? e : e.title; });
    var qrDataObj = {
      type: 'RANATANTRA_PASS',
      passId: passId,
      name: fullName,
      email: email,
      events: eventNames,
      generatedAt: new Date().toISOString()
    };
    var qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=' + encodeURIComponent(JSON.stringify(qrDataObj));

    var htmlBody = '<!DOCTYPE html>'
      + '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
      + '<body style="margin:0;padding:0;background:#05000A;font-family:\'Segoe UI\',Tahoma,Geneva,Verdana,sans-serif;">'

      // Outer wrapper
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#05000A;padding:32px 16px;">'
      + '<tr><td align="center">'
      + '<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">'

      // ── Logo Header ──
      + '<tr><td align="center" style="padding:24px 0 20px;">'
      + '<img src="https://www.ranatantra.online/logo.png" alt="Ranatantra" width="120" height="120" style="display:block;border:none;outline:none;" />'
      + '</td></tr>'

      // ── Main Card ──
      + '<tr><td>'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(180deg,#120024 0%,#0d001a 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;">'

      // ── Hero Banner ──
      + '<tr><td style="background:linear-gradient(135deg,#FF0055 0%,#cc0044 50%,#990033 100%);padding:36px 32px;text-align:center;">'
      + '<p style="margin:0 0 4px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.8);font-weight:600;">MARCH 27-28, 2026</p>'
      + '<h1 style="margin:0;font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:\'Segoe UI\',Arial,sans-serif;">ACCESS GRANTED ✅</h1>'
      + '<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Your registration for Ranatantra MBA Management Fest is confirmed</p>'
      + '</td></tr>'

      // ── Greeting ──
      + '<tr><td style="padding:32px 32px 8px;">'
      + '<p style="margin:0;font-size:18px;color:#ffffff;font-weight:600;">Hey ' + fullName + '! 👋</p>'
      + '<p style="margin:10px 0 0;font-size:14px;color:#aaa;line-height:1.6;">You\'re officially locked in. Here\'s your event lineup — save this email as your digital pass.</p>'
      + '</td></tr>'

      // ── Event Cards Section ──
      + '<tr><td style="padding:20px 32px 8px;">'
      + '<p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#00FFFF;font-weight:700;">🎯 YOUR EVENT LINEUP</p>'
      + '<table width="100%" cellpadding="0" cellspacing="0">'
      + eventCardsHtml
      + '</table>'
      + '</td></tr>'

      // ── Skipped Events (if any) ──
      + skippedHtml

      // ── Details Section ──
      + '<tr><td style="padding:24px 32px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0020;border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">'
      + infoRowsHtml
      + '</table>'
      + '</td></tr>'

      // ── Venue Card ──
      + '<tr><td style="padding:0 32px 24px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0020;border:1px solid rgba(0,255,255,0.15);border-radius:12px;overflow:hidden;">'
      + '<tr><td style="padding:20px;">'
      + '<p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#00FFFF;font-weight:700;">📍 VENUE</p>'
      + '<p style="margin:6px 0 0;font-size:16px;color:#ffffff;font-weight:600;">Jain College of Engineering & Technology</p>'
      + '<p style="margin:4px 0 0;font-size:13px;color:#999;">Machhe, Belgaum Road, Hubballi - 580044</p>'
      + '</td></tr></table>'
      + '</td></tr>'

      // ── QR Code Section ──
      + '<tr><td align="center" style="padding:0 32px 24px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">'
      + '<tr><td align="center" style="padding:24px;">'
      + '<p style="margin:0 0 16px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#05000A;font-weight:800;">YOUR DIGITAL PASS</p>'
      + '<img src="' + qrCodeUrl + '" alt="QR Code" width="180" height="180" style="display:block;border:none;outline:none;" />'
      + '<p style="margin:16px 0 0;font-size:11px;color:#666;font-family:\'Courier New\',monospace;font-weight:bold;">' + passId + '</p>'
      + '</td></tr></table>'
      + '</td></tr>'

      // ── Important Notes ──
      + '<tr><td style="padding:0 32px 28px;">'
      + '<table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,211,0,0.08);border:1px solid rgba(255,211,0,0.2);border-radius:12px;">'
      + '<tr><td style="padding:16px 20px;">'
      + '<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#FFD300;">⚠️ IMPORTANT</p>'
      + '<p style="margin:0;font-size:13px;color:#ccc;line-height:1.6;">• Bring your college ID card for entry<br>• Arrive 15 minutes early for check-in<br>• Show this email at the registration desk</p>'
      + '</td></tr></table>'
      + '</td></tr>'

      // ── CTA Button ──
      + '<tr><td align="center" style="padding:0 32px 32px;">'
      + '<a href="https://www.ranatantra.online/#/dashboard" style="display:inline-block;background:#FF0055;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">View Dashboard →</a>'
      + '</td></tr>'

      + '</table>' // end main card
      + '</td></tr>'

      // ── Footer ──
      + '<tr><td style="padding:28px 0;text-align:center;">'
      + '<p style="margin:0 0 8px;font-size:13px;color:#666;">Made with 🔥 by the Ranatantra Team</p>'
      + '<p style="margin:0;font-size:12px;color:#444;">Jain College of Engineering & Technology, Hubballi</p>'
      + '<p style="margin:12px 0 0;font-size:11px;color:#333;">This is an automated confirmation. Do not reply to this email.</p>'
      + '</td></tr>'

      + '</table>' // end inner
      + '</td></tr></table>' // end outer
      + '</body></html>';

    // Plain text fallback for clients that don't support HTML
    var eventLines = eventTitles.map(function (eventItem) {
      if (typeof eventItem === 'string') return '- ' + eventItem;
      return '- ' + eventItem.title + ' (' + eventItem.date + ')';
    });
    var plainBody = 'Hi ' + fullName + ',\n\n'
      + 'Your registration for Ranatantra MBA Management Fest is confirmed!\n\n'
      + 'Your Event Lineup:\n' + eventLines.join('\n') + '\n\n'
      + (regId ? 'Registration ID: ' + regId + '\n' : '')
      + (paymentId ? 'Payment ID: ' + paymentId + '\n' : '')
      + 'Digital Pass ID: ' + passId + '\n'
      + 'QR Code Link: ' + qrCodeUrl + '\n'
      + '\nVenue: Jain College of Engineering & Technology, Hubballi\n'
      + 'Date: March 27 - 28, 2026\n\n'
      + 'Bring your college ID card for entry.\n\n'
      + 'See you at the fest!\nRanatantra Team';

    MailApp.sendEmail({
      to: email,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });
  } catch (error) {
    console.log('Email error: ' + error);
  }
}
/**
 * Saves a base64 encoded file to Google Drive
 */
function saveFileToDrive_(fileObj, identifier) {
  try {
    let folder;
    if (REGISTRATIONS_FOLDER_ID) {
      folder = DriveApp.getFolderById(REGISTRATIONS_FOLDER_ID);
    } else {
      // Create a default folder if none specified
      const folders = DriveApp.getFoldersByName('Ranatantra_Registrations');
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Ranatantra_Registrations');
    }

    const blob = Utilities.newBlob(Utilities.base64Decode(fileObj.base64), fileObj.contentType, identifier + '_' + fileObj.fileName);
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (err) {
    Logger.log('File Save Error: ' + err.toString());
    return 'Error saving file: ' + err.toString();
  }
}
