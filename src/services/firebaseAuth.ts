import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  setPersistence,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use browserPopupRedirectResolver and safe non-IndexedDB persistence
// to prevent "auth/argument-error" and IndexedDB closing errors in iframes
export const auth: Auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
})();

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({ prompt: 'select_account' });

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onSuccess?: (user: FirebaseUser, token: string) => void,
  onFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    const token = getGoogleAccessToken();
    if (user && token) {
      if (onSuccess) onSuccess(user, token);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onFailure) onFailure();
      }
    }
  });
};

export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;

    // Enforce persistence if supported
    try {
      if (typeof window !== 'undefined') {
        await setPersistence(auth, browserLocalPersistence).catch(() => {});
      }
    } catch {
      // ignore
    }

    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal memperoleh akses token Google');
    }

    cachedAccessToken = credential.accessToken;
    setGoogleAccessToken(credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    // 1. User intentionally closed the popup or cancelled the request - treat as cancellation, not an application error
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.message?.includes('auth/popup-closed-by-user') ||
      err?.message?.includes('popup-closed-by-user')
    ) {
      console.info('Google Sign-In popup was closed or cancelled by the user.');
      return null;
    }

    // 2. Popup was blocked by the browser
    if (err?.code === 'auth/popup-blocked' || err?.message?.includes('popup-blocked')) {
      console.warn('Google Sign-In popup was blocked by the browser.');
      throw new Error(
        'Jendela pop-up login Google diblokir oleh peramban. Harap izinkan pop-up pada peramban Anda atau buka aplikasi di tab baru.'
      );
    }

    // 3. Domain is not yet authorized in Firebase Console
    if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
      console.warn('Google Sign-In domain is not yet authorized:', currentHost);
      throw new Error(
        `Domain aplikasi (${currentHost}) belum terdaftar di Firebase Authorized Domains. Anda tetap dapat menggunakan seluruh fitur aplikasi dengan akun Guru, Admin, atau Murid terdaftar, serta menyinkronkan data dengan Spreadsheet melalui Webhook atau CSV tanpa login Google.`
      );
    }

    if (err?.code === 'auth/argument-error') {
      throw new Error('Konfigurasi autentikasi peramban tidak sesuai. Silakan buka aplikasi di tab baru.');
    }

    // 4. Handle IDBDatabase connection closing error in iframes
    if (
      err?.message &&
      (err.message.includes('IDBDatabase') || err.message.includes('database connection is closing'))
    ) {
      try {
        await setPersistence(auth, inMemoryPersistence).catch(() => {});
        const retryResult = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        const retryCred = GoogleAuthProvider.credentialFromResult(retryResult);
        if (retryCred?.accessToken) {
          cachedAccessToken = retryCred.accessToken;
          setGoogleAccessToken(retryCred.accessToken);
          return { user: retryResult.user, accessToken: cachedAccessToken };
        }
      } catch (retryErr: any) {
        if (
          retryErr?.code === 'auth/popup-closed-by-user' ||
          retryErr?.message?.includes('popup-closed-by-user')
        ) {
          return null;
        }
        console.warn('Retry Google Sign In Error:', retryErr);
        throw new Error(
          'Koneksi autentikasi peramban dibatasi di dalam iframe. Silakan buka aplikasi di tab baru atau gunakan login terdaftar.'
        );
      }
    }

    console.error('Google Sign In Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved = localStorage.getItem('lms_pjok_google_token');
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch {
    // ignore
  }
  return null;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem('lms_pjok_google_token', token);
    } else {
      localStorage.removeItem('lms_pjok_google_token');
    }
  } catch {
    // ignore
  }
};

export const googleSignOut = async () => {
  try {
    await signOut(auth);
  } finally {
    setGoogleAccessToken(null);
  }
};
