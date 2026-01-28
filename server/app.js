import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { pool } from "./db.js";
import { sendAdminSignupCode, sendUserSignupCode } from "./mailer.js";

//import { sendAdminSignupCode } from "./mailer.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";


// Uploads (profile images)
const UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
const CHAT_DIR = path.join(UPLOAD_ROOT, "chat");
fs.mkdirSync(AVATAR_DIR, { recursive: true });
fs.mkdirSync(CHAT_DIR, { recursive: true });

// Serve uploaded files
app.use("/uploads", express.static(UPLOAD_ROOT));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".png";
    cb(null, `avatar_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`);
  }
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ok = (file.mimetype || "").startsWith("image/");
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  }
}).single("avatar");

// -----------------------------
// Uploads (chat images)
// -----------------------------
const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHAT_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : ".png";
    cb(null, `chat_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`);
  }
});

const uploadChatImage = multer({
  storage: chatStorage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  fileFilter: (_req, file, cb) => {
    const ok = (file.mimetype || "").startsWith("image/");
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  }
}).single("image");

function optionalAvatarUpload(req, res, next) {
  // Only handle multipart/form-data; keep JSON signup working too.
  if (req.is("multipart/form-data")) {
    return uploadAvatar(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      next();
    });
  }
  next();
}

function makeToken(user) {
  return jwt.sign(
    { user_id: user.user_id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * HEALTH
 */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/**
 * SIGNUP
 * - Creates user as not verified & not approved
 * - Creates OTP record
 * - Emails code to ADMIN (for demo; user can get code from DB if needed)
 */
app.post("/api/auth/signup", optionalAvatarUpload, async (req, res) => {
  const { name, email, password, role, district } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!["farmer", "buyer"].includes(role)) {
    return res.status(400).json({ error: "Role must be farmer/buyer" });
  }

  const conn = await pool.getConnection();
  try {
    const [exists] = await conn.query("SELECT user_id FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ error: "Email already exists" });

    const password_hash = await bcrypt.hash(password, 10);
    const profile_image = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    const [result] = await conn.query(
      "INSERT INTO users(name,email,password_hash,role,district,profile_image,is_verified,is_approved) VALUES (?,?,?,?,?,?,0,0)",
      [name, email, password_hash, role, district || null, profile_image]
    );

    const code = randomCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await conn.query(
      "INSERT INTO email_otps(email, code, purpose, expires_at, used) VALUES (?,?, 'signup_verify', ?, 0)",
      [email, code, expires]
    );

    try {
     // await sendAdminSignupCode({ email, name, role, code });
     await sendUserSignupCode({ email, name, code });

    } catch (e) {
      console.error("Email send failed:", e.message);
    }

    return res.json({
     // message: "Signup submitted. Admin will approve. (Code sent to admin email)",
     message: "Signup submitted. Check your email for the verification code. Admin approval pending.",

      user_id: result.insertId
    });
  } finally {
    conn.release();
  }
});

/**
 * VERIFY: user enters code
 */
app.post("/api/auth/verify", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Missing email/code" });

  const [rows] = await pool.query(
    `SELECT otp_id, expires_at, used FROM email_otps
     WHERE email=? AND code=? AND purpose='signup_verify'
     ORDER BY otp_id DESC LIMIT 1`,
    [email, code]
  );

  if (!rows.length) return res.status(400).json({ error: "Invalid code" });

  const otp = rows[0];
  if (otp.used) return res.status(400).json({ error: "Code already used" });
  if (new Date(otp.expires_at).getTime() < Date.now()) return res.status(400).json({ error: "Code expired" });

  await pool.query("UPDATE email_otps SET used=1 WHERE otp_id=?", [otp.otp_id]);
  await pool.query("UPDATE users SET is_verified=1 WHERE email=?", [email]);

  return res.json({ message: "Email verified successfully" });
});

/**
 * LOGIN
 */
app.post("/api/auth/login", async (req, res) => {
  let { email, password, role } = req.body;
  email = (email || "").trim();
  role = (role || "").toLowerCase();
  if (!email || !password || !role) return res.status(400).json({ error: "Missing fields" });

  const [rows] = await pool.query("SELECT * FROM users WHERE email=? AND role=? LIMIT 1", [email, role]);
  if (!rows.length) return res.status(401).json({ error: "Invalid credentials" });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  if (role !== "admin") {
    if (!user.is_verified) return res.status(403).json({ error: "Not verified. Enter confirmation code." });
    if (!user.is_approved) return res.status(403).json({ error: "Admin approval pending." });
  }

  const token = makeToken(user);
  return res.json({
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone || null,
      district: user.district,
      profile_image: user.profile_image || null
    }
  });
});

// PROFILE (buyer/farmer)
// - GET: return current user profile
// - PUT: update name/phone/district/email + optional avatar upload

app.get("/api/profile", auth(["buyer", "farmer", "admin"]), async (req, res) => {
  const me = req.user;
  const [[row]] = await pool.query(
    "SELECT user_id,name,email,role,phone,district,profile_image,is_verified,is_approved,created_at FROM users WHERE user_id=?",
    [me.user_id]
  );
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json({ user: row });
});

function optionalProfileAvatar(req, res, next) {
  if (req.is("multipart/form-data")) {
    return uploadAvatar(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message || "Upload failed" });
      next();
    });
  }
  next();
}

app.put("/api/profile", auth(["buyer", "farmer", "admin"]), optionalProfileAvatar, async (req, res) => {
  const me = req.user;
  const name = (req.body?.name || "").trim();
  const phone = (req.body?.phone || "").trim() || null;
  const district = (req.body?.district || "").trim() || null;
  const newEmail = (req.body?.email || "").trim() || null;

  // Email change: optional + unique check
  if (newEmail) {
    const [[exists]] = await pool.query(
      "SELECT user_id FROM users WHERE email=? AND user_id<>? LIMIT 1",
      [newEmail, me.user_id]
    );
    if (exists) return res.status(409).json({ error: "Email already in use" });
  }

  const profile_image = req.file ? `/uploads/avatars/${req.file.filename}` : null;

  await pool.query(
    `UPDATE users
     SET name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         district = COALESCE(?, district),
         email = COALESCE(?, email),
         profile_image = COALESCE(?, profile_image)
     WHERE user_id=?`,
    [name || null, phone, district, newEmail, profile_image, me.user_id]
  );

  const [[user]] = await pool.query("SELECT * FROM users WHERE user_id=?", [me.user_id]);
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = makeToken(user);
  res.json({
    message: "Profile updated",
    token,
    user: {
      user_id: user.user_id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone || null,
      district: user.district,
      profile_image: user.profile_image || null
    }
  });
});

/**
 * CROPS
 * Always return { items: [...] } so frontend is stable
 */
app.get("/api/crops", async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT MIN(crop_id) AS crop_id, crop_name
    FROM crops
    GROUP BY crop_name
    ORDER BY crop_name
  `);
  res.json({ items: rows });
});

/**
 * LISTINGS (market)
 */
app.get("/api/listings", async (req, res) => {
  const cropId = req.query.crop_id ? Number(req.query.crop_id) : null;

  const sql = `
    SELECT l.listing_id, l.quantity_kg, l.price_per_kg, l.status, l.created_at,
           c.crop_name,
           u.user_id AS farmer_id, u.name AS farmer_name, u.district,
           u.email AS farmer_email, u.phone AS farmer_phone, u.profile_image AS farmer_profile_image
    FROM crop_listings l
    JOIN crops c ON c.crop_id=l.crop_id
    JOIN users u ON u.user_id=l.farmer_id
    WHERE l.status='Available'
    ${cropId ? "AND l.crop_id=?" : ""}
    ORDER BY l.created_at DESC
  `;
  const [rows] = cropId ? await pool.query(sql, [cropId]) : await pool.query(sql);
  res.json({ items: rows });
});

/**
 * FARMER: create listing
 */
app.post("/api/farmer/listings", auth(["farmer"]), async (req, res) => {
  const { crop_id, quantity_kg, price_per_kg } = req.body;
  if (!crop_id || !quantity_kg || !price_per_kg) return res.status(400).json({ error: "Missing fields" });

  const farmer_id = req.user.user_id;
  const [result] = await pool.query(
    "INSERT INTO crop_listings(farmer_id,crop_id,quantity_kg,price_per_kg,status) VALUES (?,?,?,?, 'Available')",
    [farmer_id, crop_id, quantity_kg, price_per_kg]
  );
  res.json({ message: "Listing created", listing_id: result.insertId });
});

/**
 * FARMER: my listings (edit/delete)
 */
app.get("/api/farmer/my-listings", auth(["farmer"]), async (req, res) => {
  const farmer_id = req.user.user_id;
  const [rows] = await pool.query(
    `SELECT l.listing_id, l.quantity_kg, l.price_per_kg, l.status, l.created_at,
            c.crop_name, c.crop_id
     FROM crop_listings l
     JOIN crops c ON c.crop_id=l.crop_id
     WHERE l.farmer_id=?
     ORDER BY l.created_at DESC`,
    [farmer_id]
  );
  res.json({ items: rows });
});

app.put("/api/farmer/listings/:id", auth(["farmer"]), async (req, res) => {
  const listing_id = Number(req.params.id);
  const { quantity_kg, price_per_kg, status } = req.body || {};
  const farmer_id = req.user.user_id;

  const [result] = await pool.query(
    `UPDATE crop_listings
     SET quantity_kg=COALESCE(?, quantity_kg),
         price_per_kg=COALESCE(?, price_per_kg),
         status=COALESCE(?, status)
     WHERE listing_id=? AND farmer_id=?`,
    [quantity_kg ?? null, price_per_kg ?? null, status ?? null, listing_id, farmer_id]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Listing not found" });
  res.json({ message: "Listing updated" });
});

app.delete("/api/farmer/listings/:id", auth(["farmer"]), async (req, res) => {
  const listing_id = Number(req.params.id);
  const farmer_id = req.user.user_id;

  const [result] = await pool.query(
    "DELETE FROM crop_listings WHERE listing_id=? AND farmer_id=?",
    [listing_id, farmer_id]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Listing not found" });
  res.json({ message: "Listing deleted" });
});

/**
 * BUYER: purchase from listing
 */
app.post("/api/buyer/purchase", auth(["buyer"]), async (req, res) => {
  const { listing_id, quantity_kg } = req.body;
  if (!listing_id || !quantity_kg) return res.status(400).json({ error: "Missing fields" });

  const buyer_id = req.user.user_id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [listRows] = await conn.query(
      "SELECT * FROM crop_listings WHERE listing_id=? FOR UPDATE",
      [listing_id]
    );
    if (!listRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = listRows[0];
    if (listing.status !== "Available") {
      await conn.rollback();
      return res.status(400).json({ error: "Listing not available" });
    }

    const remaining = Number(listing.quantity_kg) - Number(quantity_kg);
    if (remaining < 0) {
      await conn.rollback();
      return res.status(400).json({ error: "Not enough quantity" });
    }

    const total_price = Number(quantity_kg) * Number(listing.price_per_kg);

    await conn.query(
      "UPDATE crop_listings SET quantity_kg=?, status=? WHERE listing_id=?",
      [remaining, remaining === 0 ? "Sold" : "Available", listing_id]
    );

    await conn.query(
      "INSERT INTO transactions(listing_id,buyer_id,quantity_bought_kg,total_price) VALUES (?,?,?,?)",
      [listing_id, buyer_id, quantity_kg, total_price]
    );

    await conn.commit();
    res.json({ message: "Purchase successful", total_price });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ error: "Purchase failed", details: e.message });
  } finally {
    conn.release();
  }
});

/**
 * BUYER: dashboard summary
 */
app.get("/api/buyer/dashboard", auth(["buyer"]), async (req, res) => {
  const buyer_id = req.user.user_id;
  const [[sum]] = await pool.query(
    `SELECT
        COUNT(*) AS total_orders,
        COALESCE(SUM(quantity_bought_kg),0) AS total_kg,
        COALESCE(SUM(total_price),0) AS total_spent
     FROM transactions
     WHERE buyer_id=?`,
    [buyer_id]
  );
  res.json(sum);
});

/**
 * PRICE TRENDS for chart
 */
app.get("/api/price-trends", async (req, res) => {
  const crop_id = Number(req.query.crop_id);
  if (!crop_id) return res.status(400).json({ error: "Missing crop_id" });

  const [rows] = await pool.query(
    "SELECT year, month, avg_price FROM price_trends WHERE crop_id=? ORDER BY year, month",
    [crop_id]
  );
  res.json({ items: rows });
});
/**
 * PRICE TRENDS — LAST 7 DAYS (DAILY)
 */
/*app.get("/api/price-trends/daily", async (req, res) => {
  const crop_id = Number(req.query.crop_id);
  if (!crop_id) {
    return res.status(400).json({ error: "Missing crop_id" });
  }

  const [rows] = await pool.query(
    `SELECT
       DATE(t.transaction_date) AS day,
       AVG(l.price_per_kg) AS avg_price
     FROM transactions t
     JOIN crop_listings l ON l.listing_id = t.listing_id
     WHERE l.crop_id = ?
       AND t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DATE(t.transaction_date)
     ORDER BY day`,
    [crop_id]
  );

  res.json({ items: rows });
});
*/
/**
 * BUYER: view a farmer's active listings
 */
app.get("/api/farmers/:id/listings", auth(["buyer", "admin"]), async (req, res) => {
  const farmer_id = Number(req.params.id);
  const [rows] = await pool.query(
    `SELECT l.listing_id, l.quantity_kg, l.price_per_kg, l.status, l.created_at, c.crop_name
     FROM crop_listings l
     JOIN crops c ON c.crop_id=l.crop_id
     WHERE l.farmer_id=? AND l.status='Available'
     ORDER BY l.created_at DESC`,
    [farmer_id]
  );
  res.json({ items: rows });
});

/**
 * FARMER: disease report
 */
app.post("/api/farmer/disease-report", auth(["farmer"]), async (req, res) => {
  const { crop_id, severity, notes } = req.body;
  if (!crop_id || severity == null) return res.status(400).json({ error: "Missing fields" });

  const farmer_id = req.user.user_id;
  await pool.query(
    "INSERT INTO disease_reports(farmer_id,crop_id,severity,notes) VALUES (?,?,?,?)",
    [farmer_id, Number(crop_id), Number(severity), notes || null]
  );

  res.json({ message: "Disease report submitted. Alerts auto-generated if severity >= 8." });
});

/**
 * FARMER: get my alerts
 */
app.get("/api/farmer/alerts", auth(["farmer"]), async (req, res) => {
  const farmer_id = req.user.user_id;
  const [rows] = await pool.query(
    "SELECT alert_type, message, created_at FROM alerts WHERE farmer_id=? ORDER BY created_at DESC LIMIT 50",
    [farmer_id]
  );
  res.json({ items: rows });
});

/**
 * FARMER: dashboard summary
 */
app.get("/api/farmer/summary", auth(["farmer"]), async (req, res) => {
  const farmer_id = req.user.user_id;

  const [[totalListings]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM crop_listings WHERE farmer_id=?",
    [farmer_id]
  );

  const [[activeListings]] = await pool.query(
    "SELECT COUNT(*) AS cnt FROM crop_listings WHERE farmer_id=? AND status='Available'",
    [farmer_id]
  );

  const [[sales]] = await pool.query(
    `SELECT
        COALESCE(SUM(t.quantity_bought_kg),0) AS sold_kg,
        COALESCE(SUM(t.total_price),0) AS earnings
     FROM transactions t
     JOIN crop_listings l ON l.listing_id=t.listing_id
     WHERE l.farmer_id=?`,
    [farmer_id]
  );

  res.json({
    total_listings: totalListings.cnt,
    active_listings: activeListings.cnt,
    sold_kg: sales.sold_kg,
    earnings: sales.earnings
  });
});

/**
 * ADMIN: pending users
 */
app.get("/api/admin/pending", auth(["admin"]), async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, role, district, is_verified, is_approved, created_at
     FROM users
     WHERE role IN ('farmer','buyer') AND is_approved=0
     ORDER BY created_at DESC`
  );
  res.json({ items: rows });
});

/**
 * ADMIN: all users
 */
app.get("/api/admin/users", auth(["admin"]), async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT user_id, name, email, role, district, is_verified, is_approved, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  res.json({ items: rows });
});

app.post("/api/admin/approve", auth(["admin"]), async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Missing email" });

  await pool.query("UPDATE users SET is_approved=1 WHERE email=?", [email]);
  res.json({ message: "User approved" });
});

// Admin: remove a buyer/farmer (and related rows via FK/cascade where configured)
app.delete("/api/admin/users/:id", auth(["admin"]), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid id" });

  // prevent removing self
  if (id === req.user.user_id) return res.status(400).json({ error: "Cannot remove self" });

  const [[u]] = await pool.query("SELECT user_id, role FROM users WHERE user_id=?", [id]);
  if (!u) return res.status(404).json({ error: "User not found" });
  if (!['buyer','farmer'].includes(u.role)) return res.status(400).json({ error: "Only buyer/farmer can be removed" });

  // Cleanup chats manually (safe even without FK cascade)
  await pool.query(
    "DELETE cm FROM chat_messages cm JOIN chat_threads ct ON ct.thread_id=cm.thread_id WHERE ct.buyer_id=? OR ct.farmer_id=?",
    [id, id]
  );
  await pool.query("DELETE FROM chat_threads WHERE buyer_id=? OR farmer_id=?", [id, id]);

  await pool.query("DELETE FROM transactions WHERE buyer_id=?", [id]);

  const [listingIds] = await pool.query("SELECT listing_id FROM crop_listings WHERE farmer_id=?", [id]);
  if (listingIds.length) {
    await pool.query(
      `DELETE FROM transactions WHERE listing_id IN (${listingIds.map(()=>'?').join(',')})`,
      listingIds.map(r=>r.listing_id)
    );
  }
  await pool.query("DELETE FROM crop_listings WHERE farmer_id=?", [id]);

  await pool.query("DELETE FROM users WHERE user_id=?", [id]);
  res.json({ message: "User removed" });
});

// CHAT (Quick Chat via polling)
// Requires DB tables: chat_threads, chat_messages

// Create (or get) a chat thread between a buyer and a farmer.
// Buyer calls with { farmer_id }, Farmer calls with { buyer_id }
app.post("/api/chat/thread", auth(["buyer", "farmer"]), async (req, res) => {
  try {
    const me = req.user;
    const farmer_id = req.body?.farmer_id ? Number(req.body.farmer_id) : null;
    const buyer_id = req.body?.buyer_id ? Number(req.body.buyer_id) : null;

    let bId = null;
    let fId = null;
    if (me.role === "buyer") {
      bId = me.user_id;
      fId = farmer_id;
    } else {
      fId = me.user_id;
      bId = buyer_id;
    }

    if (!bId || !fId) return res.status(400).json({ error: "Missing buyer_id/farmer_id" });

    // Validate roles (helps avoid accidental admin chat etc.)
    const [[buyerRow]] = await pool.query("SELECT user_id, role FROM users WHERE user_id=?", [bId]);
    const [[farmerRow]] = await pool.query("SELECT user_id, role FROM users WHERE user_id=?", [fId]);
    if (!buyerRow || buyerRow.role !== "buyer") return res.status(400).json({ error: "Invalid buyer" });
    if (!farmerRow || farmerRow.role !== "farmer") return res.status(400).json({ error: "Invalid farmer" });

    await pool.query(
      "INSERT IGNORE INTO chat_threads(buyer_id, farmer_id) VALUES (?,?)",
      [bId, fId]
    );

    const [[thread]] = await pool.query(
      "SELECT thread_id, buyer_id, farmer_id, created_at FROM chat_threads WHERE buyer_id=? AND farmer_id=? LIMIT 1",
      [bId, fId]
    );

    res.json({ thread });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create thread" });
  }
});

// Send a message
app.post("/api/chat/send", auth(["buyer", "farmer"]), async (req, res) => {
  try {
    const me = req.user;
    const thread_id = Number(req.body?.thread_id);
    const message = String(req.body?.message || "").trim();
    if (!thread_id || !message) return res.status(400).json({ error: "Missing thread_id/message" });

    const [[thread]] = await pool.query(
      "SELECT thread_id FROM chat_threads WHERE thread_id=? AND (buyer_id=? OR farmer_id=?)",
      [thread_id, me.user_id, me.user_id]
    );
    if (!thread) return res.status(403).json({ error: "Not allowed" });

    await pool.query(
      "INSERT INTO chat_messages(thread_id, sender_id, message, message_type, image_url) VALUES (?,?,?,?,?)",
      [thread_id, me.user_id, message, "text", null]
    );

    res.json({ message: "Sent" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send" });
  }
});

// Send an image message (multipart/form-data: thread_id + image)
app.post("/api/chat/send-image", auth(["buyer", "farmer"]), (req, res) => {
  uploadChatImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    try {
      const me = req.user;
      const thread_id = Number(req.body?.thread_id);
      if (!thread_id || !req.file) return res.status(400).json({ error: "Missing thread_id/image" });

      const [[thread]] = await pool.query(
        "SELECT thread_id FROM chat_threads WHERE thread_id=? AND (buyer_id=? OR farmer_id=?)",
        [thread_id, me.user_id, me.user_id]
      );
      if (!thread) return res.status(403).json({ error: "Not allowed" });

      const image_url = `/uploads/chat/${req.file.filename}`;
      await pool.query(
        "INSERT INTO chat_messages(thread_id, sender_id, message, message_type, image_url) VALUES (?,?,?,?,?)",
        [thread_id, me.user_id, "", "image", image_url]
      );

      return res.json({ message: "Sent", image_url });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to send image" });
    }
  });
});

// Poll messages: returns messages after a given message_id
app.get("/api/chat/messages", auth(["buyer", "farmer"]), async (req, res) => {
  try {
    const me = req.user;
    const thread_id = Number(req.query.thread_id);
    const after_id = Number(req.query.after_id || 0);
    if (!thread_id) return res.status(400).json({ error: "Missing thread_id" });

    const [[thread]] = await pool.query(
      "SELECT thread_id FROM chat_threads WHERE thread_id=? AND (buyer_id=? OR farmer_id=?)",
      [thread_id, me.user_id, me.user_id]
    );
    if (!thread) return res.status(403).json({ error: "Not allowed" });

    const [rows] = await pool.query(
      `SELECT message_id, thread_id, sender_id, message, message_type, image_url, created_at
       FROM chat_messages
       WHERE thread_id=? AND message_id > ?
       ORDER BY message_id ASC
       LIMIT 200`,
      [thread_id, after_id]
    );
    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Thread list for "My Chats" page
app.get("/api/chat/threads", auth(["buyer", "farmer"]), async (req, res) => {
  try {
    const me = req.user;

    // last message per thread
    const [rows] = await pool.query(
      `SELECT
         t.thread_id,
         t.buyer_id,
         t.farmer_id,
         u.user_id AS other_id,
         u.name AS other_name,
         u.email AS other_email,
         u.district AS other_district,
         lm.message_id AS last_message_id,
         lm.message AS last_message,
         lm.created_at AS last_message_at,
         t.created_at AS thread_created_at
       FROM chat_threads t
       JOIN users u ON u.user_id = CASE WHEN ? = 'buyer' THEN t.farmer_id ELSE t.buyer_id END
       LEFT JOIN chat_messages lm
         ON lm.message_id = (
           SELECT MAX(m2.message_id) FROM chat_messages m2 WHERE m2.thread_id = t.thread_id
         )
       WHERE ( ? = 'buyer' AND t.buyer_id = ? )
          OR ( ? = 'farmer' AND t.farmer_id = ? )
       ORDER BY COALESCE(lm.created_at, t.created_at) DESC
       LIMIT 200`,
      [me.role, me.role, me.user_id, me.role, me.user_id]
    );

    res.json({ items: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load threads" });
  }
});

// 404 fallback (JSON)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`CropVerse API running on http://localhost:${PORT}`);
  console.log("Remember to create an admin user in DB (role=admin).");
});
