const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // Library untuk menangani file

const app = express();

// Konfigurasi Multer: Menyimpan file di memory (RAM) sementara agar cocok dengan Vercel Serverless
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.redirect('/deob');
});

app.get('/deob', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// ==========================================
// RESTful API ENDPOINT: /api/decode
// Menerima JSON text ATAU File Upload
// ==========================================
app.post('/api/decode', upload.single('scriptFile'), (req, res) => {
    try {
        let codeToDecode = "";

        // Cek apakah user mengirim FILE
        if (req.file) {
            // Membaca isi file apa pun (dijadikan teks)
            codeToDecode = req.file.buffer.toString('utf-8');
        } 
        // Cek apakah user mengirim TEKS (JSON)
        else if (req.body && req.body.code) {
            codeToDecode = req.body.code;
        } 
        // Jika tidak ada dua-duanya
        else {
            return res.status(400).json({ success: false, message: "Kirimkan teks 'code' atau file 'scriptFile'" });
        }

        // ==========================================
        // DECODING ENGINE (Heuristics Dasar)
        // ==========================================
        let decoded = codeToDecode;

        // 1. Decode pola ASCII Desimal: \108\111
        decoded = decoded.replace(/\\(\d{1,3})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 10));
        });

        // 2. Decode pola ASCII Hex: \x6C\x6F
        decoded = decoded.replace(/\\x([0-9A-Fa-f]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        });

        // Catatan: Algoritma deobfuscator barcode/virtual machine tidak bisa dibuat sesederhana regex, 
        // namun script di atas akan mengupas lapisan string aslinya.

        // Kirim response RESTful
        res.status(200).json({ 
            success: true, 
            message: "Decoded successfully",
            originalSize: codeToDecode.length,
            decodedSize: decoded.length,
            decoded: decoded 
        });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

// Start Server
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 [ULTRA API ONLINE] http://localhost:${PORT}`);
    });
}

module.exports = app;
