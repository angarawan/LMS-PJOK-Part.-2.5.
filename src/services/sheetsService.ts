import { getGoogleAccessToken } from './firebaseAuth';
import { User, UserRole, Materi, PenilaianPraktik } from '../types';

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
 * Parse CSV text to partial Materi objects
 */
export const parseCSVToMateri = (csvText: string): Partial<Materi>[] => {
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

  const list: Partial<Materi>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const judul = getCol(r, ['judul', 'materi', 'title', 'nama', 'topik']);
    if (!judul) continue;

    list.push({
      id: getCol(r, ['id', 'materiid', 'kodemateri']) || `mtr-${Date.now()}-${i}`,
      judul,
      subJudul: getCol(r, ['subjudul', 'sub_judul', 'subtitle']),
      kategori: getCol(r, ['kategori', 'category', 'cabangolahraga']) || 'Permainan Bola Besar',
      fase: (getCol(r, ['fase']) || 'F') as 'E' | 'F',
      tujuanPembelajaran: getCol(r, ['tujuanpembelajaran', 'tujuan', 'capaian', 'tp']),
      deskripsi: getCol(r, ['deskripsi', 'uraian', 'konsep', 'konsepgerak']),
      materiInti: getCol(r, ['materiinti', 'materi_inti', 'kontenteks', 'konten']),
      kontenTeks: getCol(r, ['kontenteks', 'materiinti', 'konten']),
      videoUrl: getCol(r, ['videourl', 'video', 'linkvideo']),
      fileUrl: getCol(r, ['fileurl', 'file', 'pdfurl', 'dokumen']),
      status: (getCol(r, ['status', 'statuspublikasi']) || 'Publish') as 'Publish' | 'Draft',
      guruNama: getCol(r, ['gurunama', 'guru', 'dibuatoleh', 'pengampu']),
      dibuatOleh: getCol(r, ['dibuatoleh', 'gurunama', 'guru']),
      dibuatPada: getCol(r, ['dibuatpada', 'tanggal', 'date']) || new Date().toISOString().slice(0, 10),
    });
  }
  return list;
};

/**
 * Parse CSV text to partial PenilaianPraktik objects
 */
export const parseCSVToNilai = (csvText: string): Partial<PenilaianPraktik>[] => {
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

  const list: Partial<PenilaianPraktik>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const muridNama = getCol(r, ['muridnama', 'nama', 'namamurid', 'siswa', 'namasiswa']);
    if (!muridNama) continue;

    const nilaiAkhirNum = parseFloat(getCol(r, ['nilaiakhir', 'nilai', 'skorakhir'])) || 0;
    const totalSkorNum = parseFloat(getCol(r, ['totalskor', 'skor', 'poin'])) || 0;

    list.push({
      id: getCol(r, ['id', 'nilaiid']) || `nil-${Date.now()}-${i}`,
      muridNama,
      nis: getCol(r, ['nis', 'nisn']),
      materi: getCol(r, ['materi', 'materijudul', 'judul']),
      materiJudul: getCol(r, ['materi', 'materijudul', 'judul']),
      kelasNama: getCol(r, ['kelasnama', 'kelas', 'rombel']),
      nilaiAkhir: nilaiAkhirNum,
      totalSkor: totalSkorNum,
      predikat: (getCol(r, ['predikat', 'grade']) || 'B') as any,
      catatanGuru: getCol(r, ['catatanguru', 'catatan', 'evaluasi']),
      guruNama: getCol(r, ['gurunama', 'gurupenilai', 'guru']),
      tanggal: getCol(r, ['tanggal', 'date']) || new Date().toISOString().slice(0, 10),
    });
  }
  return list;
};

/**
 * Fetch table from Google Sheets directly via Google Visualization API (GViz)
 */
export const fetchSheetTableViaGViz = async (
  spreadsheetIdOrUrl: string,
  sheetName: string
): Promise<{
  success: boolean;
  data: any[];
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
        message: `HTTP ${statusCode}: Gagal membaca sheet ${sheetName}.`,
      };
    }

    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return {
        success: false,
        data: [],
        csvText: text.slice(0, 300),
        statusCode: 403,
        message: 'Google Spreadsheet bersifat Privat. Ubah akses di menu Bagikan menjadi "Siapa saja yang memiliki tautan".',
      };
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return {
        success: true,
        data: [],
        csvText: text,
        statusCode,
        message: `Sheet ${sheetName} kosong.`,
      };
    }

    const headers = rows[0].map((h) => h.trim());
    const dataList: any[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        obj[header] = row[idx] !== undefined ? row[idx] : '';
      });
      dataList.push(obj);
    }

    return {
      success: true,
      data: dataList,
      csvText: text,
      statusCode,
      message: `Berhasil membaca ${dataList.length} baris dari sheet ${sheetName}!`,
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      csvText: '',
      statusCode: 0,
      message: `Gagal membaca sheet ${sheetName}: ${err?.message || ''}`,
    };
  }
};

/**
 * Provides ready-to-copy Google Apps Script code for users to paste into Google Sheet Extensions -> Apps Script
 */
export const generateGoogleAppsScriptCode = (spreadsheetId?: string): string => {
  const openCode = spreadsheetId
    ? `var ss = SpreadsheetApp.openById("${spreadsheetId}");`
    : `var ss = SpreadsheetApp.getActiveSpreadsheet();`;

  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT - SINKRONISASI 2 ARAH (BIDIRECTIONAL) LMS PJOK
 * =========================================================================
 * Mendukung sinkronisasi penuh antara Google Spreadsheet & Aplikasi LMS:
 * - USERS & GURU (termasuk pembagian kelas diampu guru: "XI 1, XI 2, dll")
 * - MURID & KELAS (data rombel dan penugasan guru)
 * - MATERI (input materi di aplikasi masuk ke spreadsheet, dan sebaliknya)
 * - NILAI (penilaian praktik dan rekap nilai otomatis)
 * - PRESENSI, TUGAS, QUIZ, & JURNAL
 * 
 * ATURAN DAN PANDUAN PENERAPAN (DEPLOY):
 * 1. Buka Spreadsheet Google Anda.
 * 2. Klik menu 'Ekstensi' (Extensions) -> 'Apps Script'.
 * 3. Hapus seluruh isi kode lama di Apps Script, lalu tempel (paste) kode ini.
 * 4. Klik tombol 'Deploy' (Terapkan) berwarna biru -> 'New deployment' (Penerapan baru).
 *    (Jika sudah pernah deploy: Klik 'Manage deployments' -> Edit -> Versi Baru).
 * 5. Pilih tipe: 'Web app' (Aplikasi web).
 * 6. Set 'Execute as': 'Me' (Saya / Akun Anda).
 * 7. PENTING: Set 'Who has access': 'Anyone' (Siapa saja).
 * 8. Klik 'Deploy', izinkan akses (Grant Access), lalu salin 'Web app URL'.
 * 9. Tempelkan URL Web App tersebut ke modal Sinkronisasi di aplikasi LMS!
 * =========================================================================
 */

function doGet(e) {
  ${openCode}
  var sheetName = (e && e.parameter && (e.parameter.sheet || e.parameter.table)) ? (e.parameter.sheet || e.parameter.table) : 'ALL';
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  function readTable(sheet) {
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    var headers = values[0];
    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var obj = {};
      var hasData = false;
      for (var j = 0; j < headers.length; j++) {
        var key = headers[j];
        if (!key) continue;
        var val = values[i][j];

        // Format dates into YYYY-MM-DD
        if (val instanceof Date) {
          try {
            val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'Asia/Makassar', 'yyyy-MM-dd');
          } catch(dErr) {
            val = val.toISOString().slice(0, 10);
          }
        } else if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
          try { val = JSON.parse(val); } catch(err) {}
        }

        obj[key] = val;
        if (val !== '' && val !== null && val !== undefined) hasData = true;
      }
      if (hasData) rows.push(obj);
    }
    return rows;
  }

  // Jika minta SEMUA tabel (ALL) atau action=getAll
  if (sheetName === 'ALL' || action === 'getAll') {
    var allData = {};
    var sheets = ss.getSheets();
    for (var s = 0; s < sheets.length; s++) {
      var sName = sheets[s].getName();
      allData[sName] = readTable(sheets[s]);
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      success: true,
      data: allData,
      USERS: allData['USERS'] || [],
      GURU: allData['GURU'] || [],
      MURID: allData['MURID'] || [],
      KELAS: allData['KELAS'] || [],
      MATERI: allData['MATERI'] || [],
      NILAI: allData['NILAI'] || [],
      PRESENSI: allData['PRESENSI'] || [],
      TUGAS: allData['TUGAS'] || []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Jika minta sheet spesifik (misal: MATERI, USERS, atau NILAI)
  var targetSheet = ss.getSheetByName(sheetName);
  var rows = readTable(targetSheet);
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    success: true,
    sheet: sheetName,
    count: rows.length,
    data: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function writeSheetTable(ss, sheetName, dataList) {
  if (!dataList || !dataList.length) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  // Ambil semua nama kolom unik
  var headerSet = {};
  var headers = [];
  for (var i = 0; i < dataList.length; i++) {
    var item = dataList[i];
    if (item && typeof item === 'object') {
      var keys = Object.keys(item);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (!headerSet[key]) {
          headerSet[key] = true;
          headers.push(key);
        }
      }
    }
  }

  if (headers.length === 0) return;

  var rows = [headers];
  for (var r = 0; r < dataList.length; r++) {
    var record = dataList[r] || {};
    var row = [];
    for (var c = 0; c < headers.length; c++) {
      var col = headers[c];
      var cell = record[col];
      if (cell === null || cell === undefined) {
        row.push('');
      } else if (typeof cell === 'object') {
        row.push(JSON.stringify(cell));
      } else {
        row.push(String(cell));
      }
    }
    rows.push(row);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);

  // Rapikan format lembar kerja
  try {
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#0f766e')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    for (var colIdx = 1; colIdx <= Math.min(headers.length, 12); colIdx++) {
      sheet.autoResizeColumn(colIdx);
    }
  } catch(e) {}
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var payload = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sinkronisasi SEMUA Tabel (Multi-Sheet Payload dari LMS)
    if (payload.action === 'syncAll' && payload.data) {
      var dataObj = payload.data;
      var updatedCount = 0;
      if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
        for (var key in dataObj) {
          if (dataObj.hasOwnProperty(key) && Array.isArray(dataObj[key])) {
            writeSheetTable(ss, key, dataObj[key]);
            updatedCount++;
          }
        }
      } else if (Array.isArray(dataObj)) {
        var target = payload.table || payload.sheet || 'USERS';
        writeSheetTable(ss, target, dataObj);
        updatedCount++;
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Berhasil menyinkronkan ' + updatedCount + ' tabel ke Spreadsheet!',
        updatedSheets: updatedCount
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Sinkronisasi Tabel Tunggal (misal: hanya MATERI, NILAI, atau USERS)
    if ((payload.action === 'syncTable' || payload.action === 'syncMateri' || payload.action === 'syncNilai' || payload.action === 'syncUsers') && Array.isArray(payload.data)) {
      var tblName = payload.table || (payload.action === 'syncMateri' ? 'MATERI' : payload.action === 'syncNilai' ? 'NILAI' : 'USERS');
      writeSheetTable(ss, tblName, payload.data);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Tabel ' + tblName + ' berhasil diperbarui di Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Upsert Materi Tunggal (Materi baru/diedit di aplikasi masuk langsung ke Spreadsheet)
    if (payload.action === 'upsertMateri' && payload.data) {
      var m = payload.data;
      var mSheet = ss.getSheetByName('MATERI');
      if (!mSheet) mSheet = ss.insertSheet('MATERI');
      var mValues = mSheet.getDataRange().getValues();
      var mHeaders = mValues.length > 0 ? mValues[0] : [
        'id', 'judul', 'subJudul', 'kategori', 'fase', 'semester', 'tujuanPembelajaran', 'deskripsi', 'materiInti', 'videoUrl', 'status', 'guruNama', 'dibuatPada'
      ];
      if (mValues.length === 0) {
        mSheet.appendRow(mHeaders);
        mSheet.getRange(1, 1, 1, mHeaders.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      }
      
      var foundMRow = -1;
      for (var mr = 1; mr < mValues.length; mr++) {
        if (mValues[mr][0] == m.id || (m.judul && mValues[mr][1] == m.judul)) {
          foundMRow = mr + 1;
          break;
        }
      }
      var newMRow = [
        m.id || ('mtr-' + new Date().getTime()),
        m.judul || '',
        m.subJudul || '',
        m.kategori || 'Permainan Bola Besar',
        m.fase || 'F',
        m.semester || '1',
        m.tujuanPembelajaran || '',
        m.deskripsi || '',
        m.materiInti || m.kontenTeks || '',
        m.videoUrl || '',
        m.status || 'Publish',
        m.guruNama || m.dibuatOleh || '',
        m.dibuatPada || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Makassar', 'yyyy-MM-dd')
      ];
      if (foundMRow > 0) {
        mSheet.getRange(foundMRow, 1, 1, newMRow.length).setValues([newMRow]);
      } else {
        mSheet.appendRow(newMRow);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Materi "' + (m.judul || '') + '" berhasil disimpan ke Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Upsert User Tunggal (termasuk kelasDiampu untuk multi-guru)
    if (payload.action === 'upsertUser' && payload.data) {
      var u = payload.data;
      var uSheet = ss.getSheetByName('USERS');
      if (!uSheet) uSheet = ss.insertSheet('USERS');
      var uValues = uSheet.getDataRange().getValues();
      var uHeaders = uValues.length > 0 ? uValues[0] : [
        'id', 'username', 'role', 'name', 'nip', 'nis', 'email', 'status', 'kelasDiampu', 'kelasId'
      ];
      if (uValues.length === 0) {
        uSheet.appendRow(uHeaders);
        uSheet.getRange(1, 1, 1, uHeaders.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      }

      var foundURow = -1;
      for (var ur = 1; ur < uValues.length; ur++) {
        if (uValues[ur][0] == u.id || uValues[ur][1] == u.username) {
          foundURow = ur + 1;
          break;
        }
      }
      var newURow = [
        u.id || ('usr-' + new Date().getTime()),
        u.username || '',
        u.role || 'MURID',
        u.name || '',
        u.nip || '',
        u.nis || '',
        u.email || '',
        u.status || 'Aktif',
        Array.isArray(u.kelasDiampu) ? u.kelasDiampu.join(', ') : (u.kelasDiampu || ''),
        u.kelasId || ''
      ];
      if (foundURow > 0) {
        uSheet.getRange(foundURow, 1, 1, newURow.length).setValues([newURow]);
      } else {
        uSheet.appendRow(newURow);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Pengguna "' + (u.name || '') + '" berhasil disimpan di Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Upsert Nilai Praktik Tunggal
    if (payload.action === 'upsertNilai' && payload.data) {
      var n = payload.data;
      var nSheet = ss.getSheetByName('NILAI');
      if (!nSheet) nSheet = ss.insertSheet('NILAI');
      var nValues = nSheet.getDataRange().getValues();
      var nHeaders = nValues.length > 0 ? nValues[0] : [
        'id', 'tanggal', 'kelasNama', 'muridNama', 'nis', 'materi', 'totalSkor', 'nilaiAkhir', 'predikat', 'catatanGuru', 'guruNama'
      ];
      if (nValues.length === 0) {
        nSheet.appendRow(nHeaders);
        nSheet.getRange(1, 1, 1, nHeaders.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      }

      var foundNRow = -1;
      for (var nr = 1; nr < nValues.length; nr++) {
        if (nValues[nr][0] == n.id || (nValues[nr][3] == n.muridNama && nValues[nr][5] == (n.materi || n.materiJudul))) {
          foundNRow = nr + 1;
          break;
        }
      }
      var newNRow = [
        n.id || ('nil-' + new Date().getTime()),
        n.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Makassar', 'yyyy-MM-dd'),
        n.kelasNama || '',
        n.muridNama || '',
        n.nis || '',
        n.materi || n.materiJudul || '',
        n.totalSkor || 0,
        n.nilaiAkhir || 0,
        n.predikat || 'B',
        n.catatanGuru || '',
        n.guruNama || n.guruPenilai || ''
      ];
      if (foundNRow > 0) {
        nSheet.getRange(foundNRow, 1, 1, newNRow.length).setValues([newNRow]);
      } else {
        nSheet.appendRow(newNRow);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Nilai siswa "' + (n.muridNama || '') + '" berhasil disimpan di Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Upsert Presensi
    if (payload.action === 'upsertPresensi' && payload.data) {
      var pr = payload.data;
      var prSheet = ss.getSheetByName('PRESENSI');
      if (!prSheet) prSheet = ss.insertSheet('PRESENSI');
      var prValues = prSheet.getDataRange().getValues();
      var prHeaders = prValues.length > 0 ? prValues[0] : [
        'id', 'tanggal', 'kelasId', 'kelasNama', 'pertemuanKe', 'materi', 'waktuMulai', 'guruNama', 'totalHadir', 'totalIzin', 'totalSakit', 'totalAlpa'
      ];
      if (prValues.length === 0) {
        prSheet.appendRow(prHeaders);
        prSheet.getRange(1, 1, 1, prHeaders.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      }

      var recordsList = pr.records || [];
      var hadir = 0, izin = 0, sakit = 0, alpa = 0;
      for (var rk = 0; rk < recordsList.length; rk++) {
        var st = recordsList[rk].status;
        if (st === 'H') hadir++;
        else if (st === 'I') izin++;
        else if (st === 'S') sakit++;
        else if (st === 'A') alpa++;
      }

      var foundPRRow = -1;
      for (var prr = 1; prr < prValues.length; prr++) {
        if (prValues[prr][0] == pr.id || (prValues[prr][1] == pr.tanggal && prValues[prr][2] == pr.kelasId)) {
          foundPRRow = prr + 1;
          break;
        }
      }
      var newPRRow = [
        pr.id || ('prs-' + new Date().getTime()),
        pr.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Makassar', 'yyyy-MM-dd'),
        pr.kelasId || '',
        pr.kelasNama || '',
        pr.pertemuanKe || 1,
        pr.materi || '',
        pr.waktuMulai || '',
        pr.guruNama || '',
        hadir,
        izin,
        sakit,
        alpa
      ];
      if (foundPRRow > 0) {
        prSheet.getRange(foundPRRow, 1, 1, newPRRow.length).setValues([newPRRow]);
      } else {
        prSheet.appendRow(newPRRow);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        success: true,
        message: 'Presensi kelas ' + (pr.kelasNama || '') + ' berhasil disimpan di Spreadsheet!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', success: true, message: 'Operasi selesai.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;
};

