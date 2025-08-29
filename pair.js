const { malvinid } = require('./id'); 
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { Storage } = require("megajs");
const WebSocket = require('ws');

const {
    default: Malvin_Tech,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require("@whiskeysockets/baileys");

// Request deduplication map
const activeRequests = new Map();

// Function to generate a random Mega ID
function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

// Retry mechanism function
async function withRetry(operation, maxRetries = 3, delayMs = 2000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.log(`Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
    throw lastError;
}

// Connection initialization helper - UPDATED for fizzxydev/baileys-pro
async function initializeWhatsAppConnection(state, saveCreds) {
    return Malvin_Tech({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
        // Updated connection settings for baileys-pro
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 20000,
        maxIdleTimeMs: 30000,
        // Baileys-pro specific options
        markOnlineOnConnect: true,
        syncFullHistory: false,
        linkPreviewImageThumbnailWidth: 192,
        transactionOpts: {
            maxCommitRetries: 3,
            delayBetweenTriesMs: 3000
        },
        getMessage: async () => undefined,
        version: [2, 3000, 101] // WhatsApp version
    });
}

// Function to upload credentials to Mega
async function uploadCredsToMega(credsPath) {
    try {
        const storage = await new Storage({
            email: 'giddynokia@gmail.com',
            password: 'giddynokia123#'
        }).ready;
        console.log('Mega storage initialized.');

        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }

        const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;

        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

// Function to remove a file
function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Router to handle pairing code generation
router.get('/', async (req, res) => {
    // Set response timeout
    req.setTimeout(120000);
    res.setTimeout(120000);
    
    const id = malvinid(); 
    let num = req.query.number;

    // Validate number parameter
    if (!num) {
        return res.status(400).send({ error: "Number parameter is required" });
    }

    // Prevent duplicate requests for same number
    if (activeRequests.has(num)) {
        return res.status(429).send({ error: "Request already in progress for this number" });
    }

    activeRequests.set(num, true);

    async function MALVIN_PAIR_CODE() {
        // Ensure directory exists
        const dir = './temp/' + id;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(dir);

        try {
            let Malvin = await initializeWhatsAppConnection(state, saveCreds);

            // Wait for connection to be ready
            await new Promise((resolve) => {
                Malvin.ev.on('connection.update', (update) => {
                    if (update.connection === 'open') {
                        resolve();
                    }
                });
            });

            if (!Malvin.authState.creds.registered) {
                // Check if connection is open
                if (Malvin.ws.readyState !== WebSocket.OPEN) {
                    console.log('WebSocket not open, waiting for connection...');
                    await delay(3000);
                    
                    // If still not open, recreate connection
                    if (Malvin.ws.readyState !== WebSocket.OPEN) {
                        await Malvin.ws.close();
                        Malvin = await initializeWhatsAppConnection(state, saveCreds);
                    }
                }
                
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                
                // Use retry mechanism for baileys-pro
                const code = await withRetry(async () => {
                    try {
                        return await Malvin.requestPairingCode(num);
                    } catch (error) {
                        console.log('Pairing code request failed, retrying...');
                        throw error;
                    }
                }, 5, 3000); // Increased retries for baileys-pro
                
                console.log(`Your Code: ${code}`);

                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            Malvin.ev.on('creds.update', saveCreds);
            Malvin.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === "open") {
                    await delay(3000); // Reduced delay for baileys-pro
                    const filePath = __dirname + `/temp/${id}/creds.json`;

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found:", filePath);
                        return;
                    }

                    try {
                        const megaUrl = await uploadCredsToMega(filePath);
                        const sid = megaUrl.includes("https://mega.nz/file/")
                            ? 'dave~' + megaUrl.split("https://mega.nz/file/")[1]
                            : 'Error: Invalid URL';

                        console.log(`Session ID: ${sid}`);

                        // Send session ID via WhatsApp
                        const session = await Malvin.sendMessage(Malvin.user.id, { text: sid });

                        const MALVIN_TEXT = `🎉 *Welcome to Trashcore-system!* 🚀  

🔒 *Your Session ID* is ready! ⚠️ _Keep it private and secure — dont share it with anyone._ 

🔑 *Copy & Paste the SESSION_ID Above* 🛠️ Add it to your environment variable: *SESSION_ID*.  

💡 *Whats Next?* 
1️⃣ Explore all the cool features of TRASHCORE-SYSTEM.
2️⃣ Stay updated with our latest releases and support.
3️⃣ Enjoy seamless WhatsApp automation! 🤖  

🔗 *Join Our Support Group:* 👉 [Click Here to Join](https://chat.whatsapp.com/CzFlFQrkdzxFw0pxCBYM7H?mode=ac_t) 

🚀 _Thanks for choosing TRASHCORE-BOT— Let the automation begin!_ ✨`;

                        await Malvin.sendMessage(Malvin.user.id, { text: MALVIN_TEXT }, { quoted: session });

                        await delay(100);
                        await Malvin.ws.close();
                        removeFile('./temp/' + id);
                    } catch (uploadError) {
                        console.error("Upload failed:", uploadError);
                        // Try to send error message via WhatsApp
                        try {
                            await Malvin.sendMessage(Malvin.user.id, { 
                                text: `❌ Upload failed: ${uploadError.message}` 
                            });
                        } catch (msgError) {
                            console.error("Could not send error message:", msgError);
                        }
                    }
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log('Connection closed, attempting reconnect...');
                    await delay(5000); // Reduced delay for reconnect
                    MALVIN_PAIR_CODE();
                }
            });
        } catch (err) {
            console.error("Service Error:", err);
            removeFile('./temp/' + id);

            if (!res.headersSent) {
                res.status(500).send({ 
                    error: "Service is Currently Unavailable",
                    details: err.message 
                });
            }
        }
    }

    try {
        await MALVIN_PAIR_CODE();
    } catch (error) {
        console.error("Router level error:", error);
        if (!res.headersSent) {
            res.status(500).send({ 
                error: "Failed to generate pairing code",
                details: error.message 
            });
        }
    } finally {
        // Clean up
        activeRequests.delete(num);
    }
});

module.exports = router;