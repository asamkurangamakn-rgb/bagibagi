/* ============================================================
   server.js — SERVER PENAMPUNG DONASI (BAGIBAGI -> ROBLOX)
   ============================================================ */

const express = require("express");
const app = express();

// Ganti TOKEN melalui environment variable TOKEN di Railway.
const TOKEN = process.env.TOKEN || "RbxBagiBagi_2026_9xK7pQ4mN8vL2";
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Antrian ini tersimpan di memori dan akan kosong jika server restart.
let antrianDonasi = [];
let counterId = 0;

function tokenValid(req) {
  return req.query.token === TOKEN;
}

function ambil(body) {
  const fields = Array.prototype.slice.call(arguments, 1);
  for (let i = 0; i < fields.length; i++) {
    const v = body ? body[fields[i]] : undefined;
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// BagiBagi mengirimkan donasi melalui POST /webhook.
app.post("/webhook", function (req, res) {
  const donasi = {
    id: String(Date.now()) + "-" + (++counterId),
    sender_name: ambil(req.body, "sender_name", "username", "name", "pengirim", "donor_name", "from") || "Unknown",
    amount: Number(ambil(req.body, "amount", "jumlah", "nominal", "amount_gross", "value") || 0),
    message: String(ambil(req.body, "message", "pesan", "note", "comment", "message_content") || ""),
    timestamp: new Date().toISOString()
  };

  antrianDonasi.push(donasi);
  console.log("[Donasi masuk]", donasi);
  res.status(200).send("OK");
});

// Tes manual: /test?name=Budi&amount=50000&message=halo
// Sebaiknya endpoint ini dibatasi/dilindungi sebelum dipakai secara publik.
app.get("/test", function (req, res) {
  const donasi = {
    id: String(Date.now()) + "-" + (++counterId),
    sender_name: req.query.name || req.query.sender_name || "Tester",
    amount: Number(req.query.amount || 10000),
    message: String(req.query.message || "Test donasi"),
    timestamp: new Date().toISOString()
  };

  antrianDonasi.push(donasi);
  res.send("Donasi test ditambahkan!<br>" + JSON.stringify(donasi));
});

// Roblox mengambil donasi yang belum diproses.
app.get("/roblox-cek/:param", function (req, res) {
  if (!tokenValid(req)) {
    return res.status(403).json({ error: "token salah" });
  }
  res.json(antrianDonasi);
});

// Roblox mengosongkan antrian setelah memprosesnya.
app.post("/roblox-clear/:param", function (req, res) {
  if (!tokenValid(req)) {
    return res.status(403).json({ error: "token salah" });
  }
  const jumlah = antrianDonasi.length;
  antrianDonasi = [];
  res.json({ cleared: jumlah });
});

app.get("/", function (req, res) {
  res.send("<h1>Server Donasi AKTIF</h1><p>Antrian: " + antrianDonasi.length + " donasi</p>");
});

app.listen(PORT, function () {
  console.log("Server jalan di port " + PORT);
});
