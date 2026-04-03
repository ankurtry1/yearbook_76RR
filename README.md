# 📖 The Yearbook — Setup & Hosting Guide

A beautiful, static yearbook web app where classmates can write memoirs for each other.  
Hosted on **GitHub Pages** — no server or database required.

---

## 📁 Project Structure

```
yearbook/
├── index.html          ← Entry point
├── css/
│   └── style.css       ← All styles (vintage warm aesthetic)
├── js/
│   ├── utils.js        ← OTP generation, EmailJS, toast, DOM helpers
│   ├── storage.js      ← localStorage read/write layer
│   ├── auth.js         ← Register / Login / OTP verification
│   ├── memoirs.js      ← Memories tab (flip cards)
│   ├── write.js        ← Write a Memoir tab
│   └── app.js          ← Router, tab switching, boot
└── README.md           ← This file
```

---

## 🚀 Hosting on GitHub Pages (Step-by-Step)

### 1. Create a GitHub Repository

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `yearbook` (or anything you like)
3. Set visibility to **Public**
4. Click **Create repository**

### 2. Upload the Files

**Option A — GitHub web interface (easiest):**
1. Open your new repo → click **Add file → Upload files**
2. Upload the entire `yearbook/` folder contents (maintain the `css/` and `js/` subfolders)
3. Commit directly to `main`

**Option B — Git CLI:**
```bash
cd yearbook
git init
git add .
git commit -m "Initial yearbook commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/yearbook.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. In your repo → **Settings → Pages**
2. Under *Source*, choose **Deploy from a branch**
3. Select branch: `main`, folder: `/ (root)`
4. Click **Save**
5. After ~60 seconds, your site is live at:
   ```
   https://YOUR_USERNAME.github.io/yearbook/
   ```

---

## 📧 Setting Up Email OTP (EmailJS)

The app uses **EmailJS** to send OTP verification emails — free for up to 200 emails/month.

### Step 1 — Create EmailJS Account
1. Sign up at [https://www.emailjs.com](https://www.emailjs.com)
2. Go to **Email Services → Add New Service** (Gmail, Outlook, etc.)
3. Connect your email account and note the **Service ID**

### Step 2 — Create an Email Template
1. Go to **Email Templates → Create New Template**
2. Set the template body to something like:
   ```
   Hello {{to_name}},

   Your Yearbook verification code is:

   {{otp}}

   This code expires in 10 minutes.

   — The Yearbook Team
   ```
3. Set **To Email** field to: `{{to_email}}`
4. Save and note the **Template ID**

### Step 3 — Get Your Public Key
1. Go to **Account → API Keys**
2. Copy your **Public Key**

### Step 4 — Update `js/utils.js`
Open `js/utils.js` and fill in these three values:
```javascript
const EMAILJS_CONFIG = {
  PUBLIC_KEY:  "YOUR_EMAILJS_PUBLIC_KEY",
  SERVICE_ID:  "YOUR_SERVICE_ID",
  TEMPLATE_ID: "YOUR_TEMPLATE_ID",
};
```

Also set DEMO_MODE to false:
```javascript
const DEMO_MODE = false;
```

---

## 🧪 Running in Demo Mode (No Email Required)

By default `DEMO_MODE = true` in `js/utils.js`.  
In this mode, when an OTP is "sent", the code pops up in a browser `alert()` instead of going to an inbox — great for local testing.

To run locally, simply open `index.html` in a browser (no server needed for demo mode).  
For the EmailJS fetch calls to work in production, the site must be served over HTTP/S (GitHub Pages handles this).

---

## 🔐 Security Notes

> This app stores all data in the browser's `localStorage` and `sessionStorage`.  
> It is designed as a **school/hobby project**, not a production-grade system.

- Passwords are stored in plain text in `localStorage` — for a real deployment, use a backend with hashed passwords (bcrypt/Argon2).
- All data is **per-browser** — two users need to use the same hosted URL, not local files.
- The OTP flow prevents account takeover even if someone guesses a password, since the OTP goes to the registered email.

---

## ✨ Features

| Feature | Details |
|---|---|
| Register | Name, username, email, password, bio + OTP email verification |
| Login | Username + password + OTP email verification |
| Memories tab | Flip cards — front shows sender, back shows memoir |
| Write a Memoir | Live username lookup, 500-char limit, instant delivery |
| Session | `sessionStorage` — clears when browser tab closes |
| No server | Pure HTML/CSS/JS — host anywhere static |

---

## 🎨 Customisation

- **Colors**: Edit the CSS variables at the top of `css/style.css` under `:root`
- **Year in header**: Auto-set to current year via JS
- **OTP expiry**: Change `OTP_TTL_MS` in `js/auth.js` (default 10 min)
- **Memoir max length**: Change `MEMOIR_MAX_CHARS` in `js/write.js` (default 500)

---

## 📄 License

MIT — free to use, modify, and share.
