/*const { makeid } = require('./qr');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

// Request tracking to prevent duplicates
const activeSessions = new Map();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    try {
        fs.rmSync(FilePath, { recursive: true, force: true });
        return true;
    } catch (error) {
        console.error('Error removing file:', error);
        return false;
    }
}

function generateRandomText() {
    const prefix = "3EB";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomText = prefix;
    for (let i = prefix.length; i < 22; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomText += characters.charAt(randomIndex);
    }
    return randomText;
}

router.get('/', async (req, res) => {
    const id = makeid();
    
    // Prevent multiple requests
    if (activeSessions.has(id)) {
        return res.status(429).send('Session already in progress');
    }
    activeSessions.set(id, true);

    // Set timeout for response
    res.setTimeout(120000);

    let qrSent = false;

    async function MALVIN_XD_PAIR_CODE() {
        const dir = './temp/' + id;
        
        // Ensure directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(dir);

        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
                },
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 20000
            });

            sock.ev.on('creds.update', saveCreds);
            
            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Handle QR code
                if (qr && !qrSent) {
                    qrSent = true;
                    try {
                        const qrBuffer = await QRCode.toBuffer(qr);
                        res.writeHead(200, {
                            'Content-Type': 'image/png',
                            'Content-Length': qrBuffer.length
                        });
                        res.end(qrBuffer);
                    } catch (qrError) {
                        console.error('QR generation error:', qrError);
                    }
                    return;
                }

                if (connection === "open") {
                    try {
                        await delay(3000);
                        const filePath = __dirname + `/temp/${id}/creds.json`;
                        
                        if (!fs.existsSync(filePath)) {
                            throw new Error('Credentials file not found');
                        }

                        const mega_url = await upload(fs.createReadStream(filePath), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        let md = "dave~" + string_session;
                        
                        let code = await sock.sendMessage(sock.user.id, { text: md });
                        
                        let desc = `*Hey there, DAVE-MD User!* 👋🏻
╔════════════════════◇
║『 SESSION CONNECTED』
║ ✨ VENOM-XMD 🔷
║ ✨ Gifted Dave 🔷
╚════════════════════╝

---

╔════════════════════◇
║『 YOU'VE CHOSEN VENOM-XMD 』
║ - Set the session ID in Heroku:
║ - SESSION_ID: 
╚════════════════════╝

╔════════════════════◇
║ 『••• VISIT FOR HELP •••』
║ ❍ YouTube: youtube.com/@davlodavlo19
║ ❍ Owner: 254104260236
║ ❍ Repo: https://github.com/giftdee/VENOM-XMD 
║ ❍ WhatsApp Group: https://chat.whatsapp.com/LfTFxkUQ1H7Eg2D0vR3n6g
║ ❍ WhatsApp Channel: https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k
║ ❍ Instagram: https://www.instagram.com/gifted_dave_
║ ☬ ☬ ☬ ☬
╚═════════════════════╝

𒂀 Enjoy VENOM-XMD

---

Don't Forget To Give Star ⭐ To My Repo
______________________________`;
                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "DAVE-MD 𝕮𝖔𝖓𝖓𝖊𝖈𝖙𝖊𝖉",
                                    thumbnailUrl: "https://files.catbox.moe/nxzaly.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }  
                            }
                        }, { quoted: code });

                        await delay(1000);
                        await sock.ws.close();
                        removeFile(dir);
                        
                        console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅`);
                        
                        // Clean up session tracking
                        activeSessions.delete(id);

                    } catch (error) {
                        console.error('Session processing error:', error);
                        try {
                            let ddd = await sock.sendMessage(sock.user.id, { text: `Error: ${error.message}` });
                            
                            let errorDesc = `*Hey there, DAVE-MD User!* 👋🏻
╔════════════════════◇
║『 SESSION CONNECTED』
║ ✨ VENOM-XMD 🔷
║ ✨ Gifted Dave 🔷
╚════════════════════╝

---

╔════════════════════◇
║『 YOU'VE CHOSEN VENOM-XMD 』
║ - Set the session ID in Heroku:
║ - SESSION_ID: 
╚════════════════════╝

╔════════════════════◇
║ 『••• VISIT FOR HELP •••』
║ ❍ YouTube: youtube.com/@davlodavlo19
║ ❍ Owner: 254104260236
║ ❍ Repo: https://github.com/giftdee/VENOM-XMD 
║ ❍ WhatsApp Group: https://chat.whatsapp.com/LfTFxkUQ1H7Eg2D0vR3n6g
║ ❍ WhatsApp Channel: https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k
║ ❍ Instagram: https://www.instagram.com/gifted_dave_
║ ☬ ☬ ☬ ☬
╚═════════════════════╝

𒂀 Enjoy VENOM-XMD

---

Don't Forget To Give Star ⭐ To My Repo
______________________________`;
                            
                            await sock.sendMessage(sock.user.id, {
                                text: errorDesc,
                                contextInfo: {
                                    externalAdReply: {
                                        title: "DAVE-MD Error ❌",
                                        thumbnailUrl: "https://files.catbox.moe/nxzaly.jpg",
                                        sourceUrl: "https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k",
                                        mediaType: 2,
                                        renderLargerThumbnail: true
                                    }  
                                }
                            }, { quoted: ddd });
                            
                        } catch (msgError) {
                            console.error('Failed to send error message:', msgError);
                        }
                        
                        removeFile(dir);
                        activeSessions.delete(id);
                    }

                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    console.log('Connection closed, cleaning up...');
                    removeFile(dir);
                    activeSessions.delete(id);
                }
            });

        } catch (err) {
            console.error("Initialization error:", err);
            removeFile('./temp/' + id);
            activeSessions.delete(id);
            
            if (!res.headersSent) {
                res.status(500).send({ code: "❗ Service Unavailable" });
            }
        }
    }

    try {
        await MALVIN_XD_PAIR_CODE();
    } catch (error) {
        console.error('Outer error:', error);
        activeSessions.delete(id);
        if (!res.headersSent) {
            res.status(500).send({ error: "Internal server error" });
        }
    }
});

// REMOVED the destructive setInterval
// setInterval(() => { process.exit(); }, 180000); // ❌ DELETE THIS

module.exports = router;*/