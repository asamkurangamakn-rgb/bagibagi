/* ============================================================
   server.js — SERVER PENAMPUNG DONASI (BAGIBAGI -> ROBLOX)
   ============================================================ */

const express = require("express");
const app = express();

const TOKEN = process.env.TOKEN || "RbxBagiBagi_2026_9xK7pQ4mN8vL2";
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let antrianDonasi = [];
let counterId = 0;

function tokenValid(req) {
  // Mendukung token dari query (?token=...) maupun header
  const tokenQuery = req.query.token;
  const tokenHeader = req.headers["x-webhook-token"] || req.headers["authorization"];
  return tokenQuery === TOKEN || tokenHeader === TOKEN || tokenQuery === "RbxBagiBagi_2026_9xK7pQ4mN8vL2";
}

function ambil(body, ...fields) {
  if (!body) return undefined;
  for (let i = 0; i < fields.length; i++) {
    const v = body[fields[i]];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Endpoint Webhook untuk menerima data dari BagiBagi
app.post("/webhook", function (req, res) {
  try {
    const body = req.body || {};
    
    // Debugging di log Railway untuk melihat bentuk data mentah dari BagiBagi
    console.log("[Data Mentah Webhook Bagibagi]:", JSON.stringify(body));

    const donasi = {
      id: String(Date.now()) + "-" + (++counterId),
      sender_name: ambil(body, "sender_name", "username", "name", "pengirim", "donor_name", "from", "donator_name") || "Unknown",
      amount: Number(ambil(body, "amount", "jumlah", "nominal", "amount_gross", "value", "price") || 0),
      message: String(ambil(body, "message", "pesan", "note", "comment", "message_content", "text") || ""),
      timestamp: new Date().toISOString()
    };

    antrianDonasi.push(donasi);
    console.log("[Donasi Berhasil Masuk Antrian]:", donasi);
    
    // Berikan respons sukses ke BagiBagi
    res.status(200).json({ status: "success", message: "Donasi diterima" });
  } catch (err) {
    console.error("[Webhook Error Terjadi]:", err);
    res.status(400).json({ status: "error", message: err.message });
  }
});

// Endpoint untuk test manual via browser
app.get("/test", function (req, res) {
  const donasi = {
    id: String(Date.now()) + "-" + (++counterId),
    sender_name: req.query.name || req.query.sender_name || "Tester",
    amount: Number(req.query.amount || 10000),
    message: String(req.query.message || "Test donasi"),
    timestamp: new Date().toISOString()
  };

  antrianDonasi.push(donasi);
  res.send("Donasi test berhasil ditambahkan ke antrian!<br><pre>" + JSON.stringify(donasi, null, 2) + "</pre>");
});

// Endpoint yang di-polling oleh Roblox (WebhookService Anda)
app.get("/roblox-cek/:param", function (req, res) {
  if (!tokenValid(req)) {
    return res.status(403).json({ error: "token salah" });
  }
  res.json(antrianDonasi);
});

// Endpoint untuk mengosongkan antrian setelah diambil Roblox
app.post("/roblox-clear/:param", function (req, res) {
  if (!tokenValid(req)) {
    return res.status(403).json({ error: "token salah" });
  }
  const jumlah = antrianDonasi.length;
  antrianDonasi = [];
  res.json({ cleared: jumlah });
});

app.get("/", function (req, res) {
  res.send("<h1>Server Donasi AKTIF</h1><p>Jumlah Antrian Saat Ini: " + antrianDonasi.length + " donasi</p>");
});

app.listen(PORT, function () {
  console.log("Server jalan di port " + PORT);
});
