// Nightly Firebase (all tenants) -> Google Drive backup, with retention:
// keeps the last 30 days of daily backups, then thins older ones down to
// one snapshot per month (the 1st-of-month file) so Drive storage doesn't
// grow forever as more tenants/history accumulate.
//
// Requires Node 20+ (built-in fetch). Run via GitHub Actions - see
// nightly-backup.yml in .github/workflows/.

const {
    FIREBASE_DB_SECRET,
    FIREBASE_DB_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    DRIVE_FOLDER_ID,
} = process.env;

function requireEnv() {
    const missing = Object.entries({
          FIREBASE_DB_SECRET, FIREBASE_DB_URL, GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_FOLDER_ID,
    }).filter(([, v]) => !v).map(([k]) => k);
    if (missing.length) {
          throw new Error(`Missing required env vars/secrets: ${missing.join(", ")}`);
    }
}

function todayISO() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function fetchFirebaseDump() {
    const url = `${FIREBASE_DB_URL}/.json?auth=${FIREBASE_DB_SECRET}`;
    const res = await fetch(url);
    if (!res.ok) {
          throw new Error(`Firebase read failed: ${res.status} ${await res.text()}`);
    }
    return res.text(); // keep as raw JSON text - no need to parse/re-stringify
}

async function getAccessToken() {
    const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
                  client_id: GOOGLE_CLIENT_ID,
                  client_secret: GOOGLE_CLIENT_SECRET,
                  refresh_token: GOOGLE_REFRESH_TOKEN,
                  grant_type: "refresh_token",
          }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Google token refresh failed: ${JSON.stringify(data)}`);
    return data.access_token;
}

async function uploadToDrive(accessToken, filename, jsonText) {
    const metadata = { name: filename, parents: [DRIVE_FOLDER_ID] };
    const boundary = "backup_boundary_" + Date.now();
    const body =
          `--${boundary}\r\n` +
          `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
          `${JSON.stringify(metadata)}\r\n` +
          `--${boundary}\r\n` +
          `Content-Type: application/json\r\n\r\n` +
          `${jsonText}\r\n` +
          `--${boundary}--`;

  const res = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
            method: "POST",
            headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body,
    }
      );
    const data = await res.json();
    if (!res.ok) throw new Error(`Drive upload failed: ${JSON.stringify(data)}`);
    return data;
}

async function listBackups(accessToken) {
    const q = encodeURIComponent(
          `'${DRIVE_FOLDER_ID}' in parents and name contains 'agrilogix-backup-' and trashed = false`
        );
    const res = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1000`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
        );
    const data = await res.json();
    if (!res.ok) throw new Error(`Drive list failed: ${JSON.stringify(data)}`);
    return data.files || [];
}

async function deleteFile(accessToken, fileId) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok && res.status !== 404) {
          console.warn(`Warning: failed to delete file ${fileId}: ${res.status}`);
    }
}

function extractDate(filename) {
    const m = filename.match(/agrilogix-backup-(\d{4}-\d{2}-\d{2})\.json/);
    return m ? m[1] : null;
}

async function applyRetention(accessToken) {
    const files = await listBackups(accessToken);
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 30);

  for (const f of files) {
        const dateStr = extractDate(f.name);
        if (!dateStr) continue; // don't touch anything that doesn't match our naming pattern
      const d = new Date(dateStr + "T00:00:00Z");
        if (d >= cutoff) continue; // within the last 30 days - always keep
      const isFirstOfMonth = dateStr.endsWith("-01");
        if (!isFirstOfMonth) {
                console.log(`Retention: deleting ${f.name} (older than 30 days, not a monthly snapshot)`);
                await deleteFile(accessToken, f.id);
        }
  }
}

async function main() {
    requireEnv();

  console.log("Fetching full Firebase database dump...");
    const dump = await fetchFirebaseDump();
    console.log(`Dump size: ${(dump.length / 1024).toFixed(1)} KB`);

  console.log("Getting Google Drive access token...");
    const accessToken = await getAccessToken();

  const filename = `agrilogix-backup-${todayISO()}.json`;
    console.log(`Uploading ${filename} to Drive folder ${DRIVE_FOLDER_ID}...`);
    const uploaded = await uploadToDrive(accessToken, filename, dump);
    console.log(`Uploaded: ${uploaded.name} (id: ${uploaded.id})`);

  console.log("Applying 30-day retention (thinning older dailies down to monthly snapshots)...");
    await applyRetention(accessToken);

  console.log("Backup complete.");
}

main().catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
});
