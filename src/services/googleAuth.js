/**
 * Handles Google Sign-In (OAuth token) and the Drive file picker.
 *
 * Uses Google Identity Services (GIS) for the OAuth access token and the
 * classic Google Picker API to let a signed-in user choose a Spreadsheet
 * from their own Drive. The access token is requested with scopes limited
 * to Sheets + the files a user explicitly picks (drive.file), so this app
 * never gets blanket access to a user's whole Drive.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

let gisLoaded = false;
let gapiLoaded = false;
let pickerLoaded = false;
let tokenClient = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function ensureGis() {
    if (gisLoaded) return;
    await loadScript('https://accounts.google.com/gsi/client');
    gisLoaded = true;
}

async function ensureGapiPicker() {
    if (pickerLoaded) return;
    if (!gapiLoaded) {
        await loadScript('https://apis.google.com/js/api.js');
        gapiLoaded = true;
    }
    await new Promise((resolve, reject) => {
        window.gapi.load('picker', { callback: resolve, onerror: reject });
    });
    pickerLoaded = true;
}

export const GoogleAuthService = {
    isConfigured: () => Boolean(CLIENT_ID),

    /**
     * Triggers the Google OAuth consent popup and resolves with an access token.
     */
    requestAccessToken: async () => {
        if (!CLIENT_ID) {
            throw new Error('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID.');
        }
        await ensureGis();

        return new Promise((resolve, reject) => {
            if (!tokenClient) {
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: () => { } // overridden per-request below
                });
            }

            tokenClient.callback = (response) => {
                if (response.error) {
                    reject(new Error(response.error_description || response.error));
                } else {
                    resolve(response.access_token);
                }
            };
            tokenClient.requestAccessToken({ prompt: '' });
        });
    },

    revokeAccessToken: (accessToken) => {
        if (accessToken && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(accessToken);
        }
    },

    /**
     * Opens the Google Picker scoped to Spreadsheets and resolves with the
     * chosen file's { id, name }, or null if the user cancels.
     */
    showSpreadsheetPicker: async (accessToken) => {
        if (!API_KEY) {
            throw new Error('Google Picker is not configured. Set VITE_GOOGLE_API_KEY.');
        }
        await ensureGapiPicker();

        return new Promise((resolve) => {
            const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
                .setMode(window.google.picker.DocsViewMode.LIST);

            const picker = new window.google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(accessToken)
                .setDeveloperKey(API_KEY)
                .setCallback((data) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const doc = data.docs[0];
                        resolve({ id: doc.id, name: doc.name });
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        resolve(null);
                    }
                })
                .build();
            picker.setVisible(true);
        });
    }
};
