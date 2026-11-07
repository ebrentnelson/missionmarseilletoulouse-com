/**
 * Mission Marseille/Toulouse reunion backend.
 *
 * One web app backs every dynamic piece of the site: RSVPs, song requests, and
 * the moderated photo gallery. Everything lives in one spreadsheet plus one
 * Drive folder, so there is no server to run and moderation is just editing a
 * cell. See SETUP.md for how to deploy and wire it up.
 *
 * Script Properties required (Project Settings -> Script Properties):
 *   SHEET_ID           the spreadsheet holding the RSVP / Songs / Gallery tabs
 *   GALLERY_FOLDER_ID  the Drive folder uploads are saved into
 *   SUBMIT_TOKEN       a shared string the site sends with every POST (spam gate)
 */

const PROPS = PropertiesService.getScriptProperties();

function doPost(e) {
  try {
    // honeypot: real people leave this hidden field empty
    if (e.parameter.website) return json_({ ok: true });
    if (e.parameter.token !== PROPS.getProperty('SUBMIT_TOKEN')) {
      return json_({ ok: false, error: 'bad token' });
    }

    switch ((e.parameter.form || '').toLowerCase()) {
      case 'rsvp':
        append_('RSVP', [new Date(), e.parameter.name, e.parameter.email,
                         e.parameter.years, e.parameter.party, e.parameter.area,
                         'pending']);
        return json_({ ok: true });
      case 'song':
        append_('Songs', [new Date(), e.parameter.name, e.parameter.carol,
                          e.parameter.note]);
        return json_({ ok: true });
      case 'gallery':
        return saveImage_(e);
      default:
        return json_({ ok: false, error: 'unknown form' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  switch ((e.parameter.type || '').toLowerCase()) {
    case 'attendees': return json_(attendees_());
    case 'gallery':   return json_(gallery_());
    default:          return json_({ ok: true, service: 'mmt-reunion' });
  }
}

/* ---- writes ---- */

function saveImage_(e) {
  const folder = DriveApp.getFolderById(PROPS.getProperty('GALLERY_FOLDER_ID'));
  const data = e.parameter.image || '';
  const b64 = data.indexOf(',') >= 0 ? data.split(',')[1] : data; // strip data: prefix
  const blob = Utilities.newBlob(Utilities.base64Decode(b64),
                                 e.parameter.mime || 'image/jpeg',
                                 e.parameter.filename || 'upload.jpg');
  const file = folder.createFile(blob);
  // left private until approved; gallery_() shares it only once it goes live
  append_('Gallery', [new Date(), e.parameter.name || '', e.parameter.caption || '',
                      file.getId(), 'pending']);
  return json_({ ok: true });
}

function append_(tab, row) {
  sheet_(tab).appendRow(row);
}

/* ---- reads ---- */

function attendees_() {
  const rows = sheet_('RSVP').getDataRange().getValues();
  const list = [];
  let people = 0;
  for (let i = 1; i < rows.length; i++) {
    const [ts, name, email, years, party, area, status] = rows[i];
    if (String(status).toLowerCase() !== 'approved') continue;
    const size = parseInt(party, 10) || 1;
    people += size;
    list.push({ name: name, years: years, area: area, party: size });
  }
  return { ok: true, people: people, parties: list.length, attendees: list };
}

function gallery_() {
  const rows = sheet_('Gallery').getDataRange().getValues();
  const images = [];
  for (let i = 1; i < rows.length; i++) {
    const [ts, name, caption, fileId, status] = rows[i];
    if (String(status).toLowerCase() !== 'approved') continue;
    const file = DriveApp.getFileById(fileId);
    // share on first approval, idempotent on later reads
    if (file.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    images.push({
      caption: caption,
      name: name,
      url: 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w1600'
    });
  }
  return { ok: true, images: images };
}

/* ---- helpers ---- */

function sheet_(tab) {
  return SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID')).getSheetByName(tab);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
