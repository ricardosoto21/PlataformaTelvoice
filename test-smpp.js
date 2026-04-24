const fs = require('fs');
const path = require('path');
const smpp = require('smpp');

function loadEnvLocal() {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) return;

    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex <= 0) continue;

        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

loadEnvLocal();

const SMPP_URL = process.env.SMPP_URL || 'smpp://localhost:2775';
const SYSTEM_ID = process.env.SMPP_SYSTEM_ID;
const PASSWORD = process.env.SMPP_PASSWORD;
const SOURCE_ADDR = process.env.SMPP_SOURCE_ADDR || 'INFO';
const DESTINATION_ADDR = process.env.SMPP_DESTINATION_ADDR;
const SHORT_MESSAGE = process.env.SMPP_MESSAGE || 'Mensaje de prueba TelvoiceSMS';

if (!SYSTEM_ID || !PASSWORD || !DESTINATION_ADDR) {
    console.error('Missing required env vars: SMPP_SYSTEM_ID, SMPP_PASSWORD, SMPP_DESTINATION_ADDR');
    process.exit(1);
}

const session = smpp.connect({
    url: SMPP_URL,
});

session.bind_transceiver({
    system_id: SYSTEM_ID,
    password: PASSWORD,
}, (pdu) => {
    if (pdu.command_status === 0) {
        console.log('SMPP bind successful');

        session.submit_sm({
            source_addr: SOURCE_ADDR,
            destination_addr: DESTINATION_ADDR,
            short_message: SHORT_MESSAGE,
        }, (submitPdu) => {
            if (submitPdu.command_status === 0) {
                console.log('Message accepted by server. Message ID:', submitPdu.message_id);
            } else {
                console.log('Server rejected the message. Error code:', submitPdu.command_status);
            }

            setTimeout(() => {
                session.unbind();
                process.exit();
            }, 2000);
        });
    } else {
        console.log('Authentication failed. Command status:', pdu.command_status);
        process.exit();
    }
});

session.on('error', (err) => {
    console.log('TCP connection error:', err.message);
});
