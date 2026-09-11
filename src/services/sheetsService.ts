import { getGoogleAccessToken } from './firebaseAuth';
import { User, UserRole } from '../types';

export interface SheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheets: string[];
}

export const REQUIRED_SHEETS = [
  'USERS',
  'ADMIN',
  'GURU',
  'MURID',
  'KELAS',
  'MATERI',
  'TUGAS',
  'PENGUMPULAN',
  'QUIZ',
  'SOAL',
  'JAWABAN',
  'PRESENSI',
  'NILAI',
  'JURNAL',
  'NOTIFIKASI',
  'SETTING',
];

/**
 * Extract spreadsheet ID from full URL or return ID directly
 */
export const extractSpreadsheetId = (urlOrId: string): string | null => {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's already an ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

export const createPJOKSpreadsheet = async (title: string = 'LMS_PJOK_DATABASE_2026'): Promise<SheetMetadata> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Belum terhubung dengan akun Google. Silakan klik Sambungkan Google.');
  }

  // Create new Spreadsheet with the sheets
  const sheetsConfig = REQUIRED_SHEETS.map((sheetTitle) => ({
    properties: { title: sheetTitle },
  }));

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: sheetsConfig,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    sheets: REQUIRED_SHEETS,
  };
};

export const syncAllDataToSpreadsheet = async (
  spreadsheetId: string,
  allData: Record<string, any[]>
): Promise<{ success: boolean; updatedSheets: number }> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Akses token Google tidak tersedia');
  }

  // Prepare batch value data
  const dataPayload: Array<{ range: string; values: any[][] }> = [];

  for (const sheetName of REQUIRED_SHEETS) {
    const records = allData[sheetName] || [];
    if (records.length === 0) {
      dataPayload.push({
        range: `${sheetName}!A1:Z1`,
        values: [['ID', 'DATA_KOSONG', 'TIMESTAMP']],
      });
      continue;
    }

    // Extract headers
    const sample = records[0];
    const headers = Object.keys(sample);
    const rows = records.map((item) =>
      headers.map((key) => {
        const val = item[key];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val !== undefined && val !== null ? String(val) : '';
      })
    );

    dataPayload.push({
      range: `${sheetName}!A1`,
      values: [headers, ...rows],
    });
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gagal sinkronisasi data: ${errText}`);
  }

  return { success: true, updatedSheets: dataPayload.length };
};

export const fetchSheetData = async (
  spreadsheetId: string,
  sheetName: string
): Promise<any[]> => {
  const token = getGoogleAccessToken();
  if (!token) {
    throw new Error('Akses token Google tidak tersedia');
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z500`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Gagal membaca sheet ${sheetName}: ${res.statusText}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0];
  const items = rows.slice(1).map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h: string, idx: number) => {
      const val = row[idx] ?? '';
      try {
        if (val.startsWith('{') || val.startsWith('[')) {
          obj[h] = JSON.parse(val);
        } else {
          obj[h] = val;
        }
      } catch {
        obj[h] = val;
      }
    });
    return obj;
  });

  return items;
};

/**
 * Robust CSV parser that handles commas inside quotes, multi-line values, and tab/semicolon separators.
 */
export const parseCSV = (text: string): string[][] => {
  const clean = text.trim();
  if (!clean) return [];

  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let insideQuote = false;

  // Auto detect delimiter (tab, semicolon, or comma)
  const firstLine = clean.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === delimiter && !insideQuote) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      currentVal = '';
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
};

/**
 * Parse CSV text into User records
 * Supports format: id,username,role,name,nip,email,status,avatar
 */
export const parseCSVToUsers = (csvText: string): User[] => {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const rawHeaders = rows[0].map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getCol = (r: string[], colNames: string[]): string => {
    for (const name of colNames) {
      if (headerMap[name] !== undefined && r[headerMap[name]] !== undefined) {
        return r[headerMap[name]].trim();
      }
    }
    return '';
  };

  const users: User[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || row.every((c) => !c)) continue;

    const id = getCol(row, ['id', 'userid']) || `usr-${Date.now()}-${i}`;
    const username = getCol(row, ['username', 'user', 'nis', 'nip']) || `user${i}`;
    let roleStr = getCol(row, ['role', 'peran']).toUpperCase();
    let role: UserRole = 'MURID';
    if (roleStr.includes('ADMIN')) {
      role = 'ADMIN';
    } else if (roleStr.includes('GURU')) {
      role = 'GURU';
    } else {
      role = 'MURID';
    }

    const name = getCol(row, ['name', 'nama', 'namalengkap']) || username;
    const nipOrNis = getCol(row, ['nip', 'nis', 'nisn', 'nomorinduk']);
    const email = getCol(row, ['email', 'surel']);
    const statusRaw = getCol(row, ['status']);
    const status: 'Aktif' | 'Nonaktif' = statusRaw.toLowerCase().includes('non') ? 'Nonaktif' : 'Aktif';
    const avatar = getCol(row, ['avatar', 'foto', 'image', 'fotoprofil']);

    const user: User = {
      id,
      username,
      role,
      name,
      email: email || undefined,
      status,
      avatar: avatar || undefined,
    };

    if (role === 'ADMIN' || role === 'GURU') {
      user.nip = nipOrNis || undefined;
      user.mataPelajaran = role === 'GURU' ? 'PJOK Fase E & F' : undefined;
    } else {
      // Murid
      user.nis = nipOrNis || undefined;
      user.kelasId = 'cls-xi-1';
      user.tahunPelajaran = '2026/2027';
      // Detect gender guess from name
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('ni ') ||
        lowerName.includes('putu ') ||
        lowerName.includes('dewi') ||
        lowerName.includes('ayu') ||
        lowerName.includes('luh ') ||
        lowerName.includes('komang ayu') ||
        lowerName.includes('savitri') ||
        lowerName.includes('purwani') ||
        lowerName.includes('caitanya') ||
        lowerName.includes('febriana') ||
        lowerName.includes('vitare') ||
        lowerName.includes('sinthya') ||
        lowerName.includes('cintya') ||
        lowerName.includes('sinta') ||
        lowerName.includes('nadine') ||
        lowerName.includes('ida ayu')
      ) {
        user.jenisKelamin = 'P';
      } else {
        user.jenisKelamin = 'L';
      }
    }

    users.push(user);
  }

  return users;
};

/**
 * Export users array to CSV matching the user's exact specification:
 * id,username,role,name,nip,email,status,avatar
 */
export const exportUsersToCSV = (users: User[]): string => {
  const headers = ['id', 'username', 'role', 'name', 'nip', 'email', 'status', 'avatar'];
  const escapeCell = (val: any): string => {
    if (val === undefined || val === null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = users.map((u) => {
    const nipVal = u.role === 'MURID' ? u.nis || u.nip || '' : u.nip || '';
    const roleVal = u.role === 'MURID' ? (u.username.startsWith('murid') ? u.username : 'MURID') : u.role;
    return [
      escapeCell(u.id),
      escapeCell(u.username),
      escapeCell(roleVal),
      escapeCell(u.name),
      escapeCell(nipVal),
      escapeCell(u.email || ''),
      escapeCell(u.status),
      escapeCell(u.avatar || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Send bidirectional data update to Google Apps Script Web App
 */
export const syncViaAppsScriptWebhook = async (
  webhookUrl: string,
  payload: { action: string; table?: string; data: any } | Record<string, any[]>
): Promise<{ success: boolean; message: string; statusCode?: number; details?: string }> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    throw new Error('URL Webhook / Google Apps Script tidak valid.');
  }

  const normalizedPayload =
    'action' in payload
      ? payload
      : {
          action: 'syncAll',
          data: payload,
          updatedAt: new Date().toISOString(),
        };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script accepts text/plain to avoid CORS preflight options issues
      },
      body: JSON.stringify(normalizedPayload),
    });

    const statusCode = res.status;
    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Server Google Apps Script merespons kode HTTP ${statusCode}: ${res.statusText} (${text.slice(0, 200)})`);
    }

    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { status: 'success', message: text.slice(0, 150) };
    }

    return {
      success: true,
      statusCode,
      message: json.message || 'Data berhasil dikirim ke Google Spreadsheet!',
      details: text.slice(0, 300),
    };
  } catch (err: any) {
    const isCors = err?.name === 'TypeError' || String(err).includes('fetch');
    if (isCors) {
      // Note: Google Apps Script Web App redirects with 302, which browser fetch sometimes flags as opaque or cross-origin
      return {
        success: true,
        statusCode: 200,
        message: 'Perintah pembaruan spreadsheet telah dikirimkan ke Google Apps Script.',
        details: 'Permintaan dikirim (background 302 redirect). Cek Google Spreadsheet Anda untuk memastikan data terupdate.',
      };
    }
    return {
      success: false,
      statusCode: 0,
      message: err?.message || 'Gagal mengirim data ke Webhook Google Apps Script.',
      details: String(err),
    };
  }
};

/**
 * Fetch data directly from Google Sheets via Google Visualization API (GViz) CSV
 * Works if the Google Sheet has "Anyone with the link can view" permission without needing Apps Script!
 */
export const fetchSheetViaGViz = async (
  spreadsheetIdOrUrl: string,
  sheetName: string = 'USERS'
): Promise<{
  success: boolean;
  data: User[];
  csvText: string;
  statusCode: number;
  message: string;
}> => {
  const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
  if (!spreadsheetId) {
    return {
      success: false,
      data: [],
      csvText: '',
      statusCode: 400,
      message: 'ID Google Spreadsheet tidak valid atau tidak ditemukan dalam URL.',
    };
  }

  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const res = await fetch(gvizUrl, { method: 'GET' });
    const statusCode = res.status;
    const text = await res.text();

    if (!res.ok) {
      return {
        success: false,
        data: [],
        csvText: text.slice(0, 300),
        statusCode,
        message: `HTTP ${statusCode}: Gagal membaca data GViz. Pastikan Spreadsheet disetel "Siapa saja dengan link dapat melihat".`,
      };
    }

    // If Google returned HTML instead of CSV (usually login or private error)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return {
        success: false,
        data: [],
        csvText: text.slice(0, 300),
        statusCode: 403,
        message: 'Google Spreadsheet bersifat Privat. Ubah akses di menu Bagikan (Share) menjadi "Siapa saja yang memiliki tautan (Anyone with link: Viewer)".',
      };
    }

    const users = parseCSVToUsers(text);
    return {
      success: true,
      data: users,
      csvText: text,
      statusCode,
      message: `Berhasil mengambil ${users.length} pengguna via GViz CSV langsung!`,
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      csvText: '',
      statusCode: 0,
      message: `Koneksi ke GViz gagal: ${err?.message || 'Periksa koneksi internet / izin Spreadsheet'}.`,
    };
  }
};

/**
 * Fetch data from Google Apps Script Web App with comprehensive diagnostics
 */
export const fetchViaAppsScriptWebhook = async (
  webhookUrl: string,
  sheetName: string = 'USERS'
): Promise<{
  success: boolean;
  data?: any;
  status?: string;
  message?: string;
  statusCode: number;
  rawText?: string;
  isHtml?: boolean;
  corsBlocked?: boolean;
  authError?: boolean;
}> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return {
      success: false,
      statusCode: 400,
      message: 'URL Webhook / Google Apps Script tidak valid atau kosong.',
    };
  }

  // Detect if user mistakenly pasted a Google Spreadsheet URL into the Webhook field
  if (webhookUrl.includes('docs.google.com/spreadsheets')) {
    const gvizRes = await fetchSheetViaGViz(webhookUrl, sheetName);
    return {
      success: gvizRes.success,
      data: gvizRes.data,
      status: gvizRes.success ? 'success' : 'error',
      message: gvizRes.message,
      statusCode: gvizRes.statusCode,
      rawText: gvizRes.csvText.slice(0, 300),
    };
  }

  let url: URL;
  try {
    url = new URL(webhookUrl);
    url.searchParams.set('action', 'getData');
    url.searchParams.set('sheet', sheetName);
  } catch {
    return {
      success: false,
      statusCode: 400,
      message: 'Format URL Webhook tidak dapat di-parse sebagai URL valid.',
    };
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
    });

    const statusCode = res.status;
    const text = await res.text();
    const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

    if (isHtml) {
      // Check if it's Google Accounts login page
      const isGoogleLogin = text.includes('accounts.google.com') || text.includes('Sign in') || text.includes('Google Accounts');
      return {
        success: false,
        statusCode: 401,
        isHtml: true,
        authError: isGoogleLogin,
        rawText: text.slice(0, 400),
        message: isGoogleLogin
          ? 'Google Apps Script meminta login (Autentikasi diperlukan). Pastikan saat Deploy disetel "Who has access: Anyone (Siapa saja)".'
          : 'Webhook mengembalikan halaman HTML alih-alih data JSON. Periksa URL deployment Web App.',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        statusCode,
        rawText: text.slice(0, 400),
        message: `HTTP ${statusCode}: Google Apps Script mengembalikan status error (${res.statusText}).`,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not JSON, might be CSV text or plain string
      return {
        success: false,
        statusCode,
        rawText: text.slice(0, 400),
        message: 'Respons dari Google Apps Script bukan format JSON yang valid.',
      };
    }

    // Normalizing parsed response structure
    let extractedData: any[] = [];
    if (Array.isArray(parsed)) {
      extractedData = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.data)) {
        extractedData = parsed.data;
      } else if (Array.isArray(parsed.USERS)) {
        extractedData = parsed.USERS;
      } else if (Array.isArray(parsed.users)) {
        extractedData = parsed.users;
      } else if (Array.isArray(parsed.rows)) {
        extractedData = parsed.rows;
      } else if (parsed.data && typeof parsed.data === 'object' && Array.isArray(parsed.data.USERS)) {
        extractedData = parsed.data.USERS;
      }
    }

    const isSuccess = parsed.status === 'success' || parsed.success === true || extractedData.length > 0;

    return {
      success: isSuccess,
      data: extractedData,
      status: parsed.status || (isSuccess ? 'success' : 'error'),
      message: parsed.message || (isSuccess ? `Berhasil menerima ${extractedData.length} baris data.` : 'Tidak ada data yang ditemukan.'),
      statusCode,
      rawText: text.slice(0, 400),
    };
  } catch (err: any) {
    const isCors = err?.name === 'TypeError' || String(err).includes('fetch');
    return {
      success: false,
      statusCode: 0,
      corsBlocked: isCors,
      message: isCors
        ? 'Gagal menghubungi Webhook (Terhalang CORS / Browser Security). Penyebab umum: Google Apps Script Web App belum disetel "Who has access: Anyone (Siapa saja)", atau URL bukan Web App /exec yang valid.'
        : `Kesalahan jaringan: ${err?.message || 'Tidak dapat terhubung ke server Google.'}`,
      rawText: String(err),
    };
  }
};

/**
 * Fetch from published Google Sheets CSV link
 */
export const fetchFromPublicSheetCSV = async (csvUrl: string): Promise<string> => {
  let url = csvUrl.trim();
  // If user pasted normal edit link, convert to CSV export link
  const sheetId = extractSpreadsheetId(url);
  if (sheetId && !url.includes('output=csv') && !url.includes('tqx=out:csv')) {
    url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data CSV Google Sheet: ${res.statusText}`);
  }
  return await res.text();
};

/**
 * Provides ready-to-copy Google Apps Script code for users to paste into Google Sheet Extensions -> Apps Script
 */
export const generateGoogleAppsScriptCode = (spreadsheetId?: string): string => {
  const openCode = spreadsheetId
    ? `var ss = SpreadsheetApp.openById("${spreadsheetId}");`
    : `var ss = SpreadsheetApp.getActiveSpreadsheet();`;

  return `/**
 * GOOGLE APPS SCRIPT - DUA ARAH (BIDIRECTIONAL) LMS PJOK NUSANTARA
 * Cara Pasang:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) -> 'Apps Script'.
 * 3. Hapus kode bawaan dan tempel kode ini seluruhnya.
 * 4. Klik tombol 'Deploy' (Terapkan) -> 'New deployment' (Penerapan baru).
 * 5. Pilih tipe: 'Web app' (Aplikasi web).
 * 6. Set 'Execute as': 'Me' (Saya).
 * 7. Set 'Who has access': 'Anyone' (Siapa saja).
 * 8. Klik 'Deploy', izinkan akses, lalu salin 'Web app URL' ke dalam LMS PJOK!
 */

function doGet(e) {
  ${openCode}
  var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'USERS';
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }
  
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({ headers: [], rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[i][j];
    }
    rows.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    success: true,
    sheet: sheetName,
    count: rows.length,
    data: rows,
    USERS: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var sheetName = payload.table || payload.sheet || 'USERS';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    if (payload.action === 'syncAll' && payload.data) {
      // Overwrite or update all records
      var dataList = Array.isArray(payload.data) ? payload.data : [];
      if (dataList.length > 0) {
        var headers = Object.keys(dataList[0]);
        var rows = [headers];
        for (var i = 0; i < dataList.length; i++) {
          var row = [];
          for (var j = 0; j < headers.length; j++) {
            var val = dataList[i][headers[j]];
            row.push(typeof val === 'object' ? JSON.stringify(val) : (val !== undefined ? val : ''));
          }
          rows.push(row);
        }
        sheet.clearContents();
        sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
      }
    } else if (payload.action === 'upsertUser' && payload.data) {
      // Add or update single user row
      var u = payload.data;
      var values = sheet.getDataRange().getValues();
      var headers = values.length > 0 ? values[0] : ['id', 'username', 'role', 'name', 'nip', 'email', 'status', 'avatar'];
      
      if (values.length === 0) {
        sheet.appendRow(headers);
      }
      
      var foundRow = -1;
      for (var r = 1; r < values.length; r++) {
        if (values[r][0] == u.id || values[r][1] == u.username) {
          foundRow = r + 1;
          break;
        }
      }
      
      var newRow = [
        u.id || '',
        u.username || '',
        u.role || '',
        u.name || '',
        u.nip || u.nis || '',
        u.email || '',
        u.status || 'Aktif',
        u.avatar || ''
      ];
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, newRow.length).setValues([newRow]);
      } else {
        sheet.appendRow(newRow);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', success: true, message: 'Tersinkronisasi!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
};

