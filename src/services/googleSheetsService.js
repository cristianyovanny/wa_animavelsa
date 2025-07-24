import path from 'path';
import { google } from 'googleapis';
import config from '../config/env.js';

const sheets = google.sheets('v4');

async function appendRow(auth, spreadsheetId, values) {
    const request = {
        spreadsheetId,
        range: 'reservas',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [values],
        },
        auth,
    };

    try {
        const response = (await sheets.spreadsheets.values.append(request)).data;
        return response;
    } catch (error) {
        console.error('Error appending row:', error);
        throw error;
    }
}

const appendToSheet = async (data) => {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                type: config.TYPE_CREDENTIALS,
                project_id: config.PROJECT_ID_CREDENTIALS,
                private_key_id: config.PRIVATE_KEY_ID_CREDENTIALS,
                private_key: config.PRIVATE_KEY_CREDENTIALS?.replace(/\\n/g, '\n'),
                client_email: config.CLIENT_EMAIL_CREDENTIALS,
                client_id: config.CLIENT_ID_CREDENTIALS,
                auth_uri: config.AUTH_URI_CREDENTIALS,
                token_uri: config.TOKEN_URI_CREDENTIALS,
                auth_provider_x509_cert_url: config.AUTH_PROVIDER_X509_CERT_URL_CREDENTIALS,
                client_x509_cert_url: config.CLIENT_X509_CERT_URL_CREDENTIALS,
                universe_domain: config.UNIVERSAL_DOMAIN_CREDENTIALS
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const authClient = await auth.getClient();
        const spreadsheetId = `${config.SPREADSHEET_ID_CREDENTIALS}`; // Replace with your actual spreadsheet ID

        await appendRow(authClient, spreadsheetId, data);
        return { success: true, message: 'Row appended successfully' };

    } catch (error) {
        console.error('Error appending to Google Sheet:', error);
        throw error;
    }
}

export default appendToSheet;