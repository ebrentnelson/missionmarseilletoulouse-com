# Reunion backend — setup

One Google Apps Script web app backs the RSVP form, the song requests, and the
moderated gallery. No server to run; moderation is editing a cell.

## 1. Create the spreadsheet

Make one Google Sheet (any name) with three tabs. Row 1 is headers.

**RSVP**
| timestamp | name | email | years | party | area | status |

**Songs**
| timestamp | name | carol | note |

**Gallery**
| timestamp | name | caption | fileId | status |

Copy the spreadsheet ID from its URL
(`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`).

## 2. Create the Drive folder

Make a Drive folder for uploads (e.g. "Reunion gallery uploads"). Copy its ID
from the URL (`https://drive.google.com/drive/folders/`**`THIS_PART`**).

## 3. Create the Apps Script project

1. Go to <https://script.google.com> → **New project**.
2. Replace the contents of `Code.gs` with the `Code.gs` in this folder.
3. **Project Settings → Script Properties → Add**, three rows:
   - `SHEET_ID` → the spreadsheet ID from step 1
   - `GALLERY_FOLDER_ID` → the folder ID from step 2
   - `SUBMIT_TOKEN` → any random string (e.g. a UUID); the site sends this with
     every submit so bots can't spam the sheet
4. **Deploy → New deployment → type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, authorize when prompted, and copy the **Web app URL**
   (ends in `/exec`).

## 4. Send back

Give me the **Web app URL** and the **`SUBMIT_TOKEN`** and I'll wire the site's
forms, attendee wall, and gallery to it. (The token is not a real secret — it
lives in the page — it just stops drive-by spam.)

## Moderating

- **RSVPs** and **gallery photos** land with `status = pending` and do not show
  on the site until you set `status` to `approved` in the sheet. Set it to
  anything else (or leave blank) to keep something hidden.
- **Song requests** are not moderated; they just collect in the Songs tab.

## Re-deploying after a code change

Edit `Code.gs` in the editor, then **Deploy → Manage deployments → (edit) →
Version: New version → Deploy**. The URL stays the same.
