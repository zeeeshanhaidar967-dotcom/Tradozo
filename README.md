# Universal Indian Retail Stock, Billing & Khata Application

An offline-first, mobile-responsive stock, sales, customer ledger (*udhaar*), and inventory management Android application engineered for small retail shop owners across India (Kirana, Hardware, Medical Stores, Clothing, Mobile & Electronics, Stationery, Paint, Furniture, Marble & Tiles, and General Retail).

---

## Table of Contents
1. [Tech Stack & Architecture](#tech-stack--architecture)
2. [Local Setup & Running](#local-setup--running)
3. [Step-by-Step Beginner Guide: Firebase Setup](#step-by-step-beginner-guide-firebase-setup)
4. [Step-by-Step Beginner Guide: Secure Gemini API Key](#step-by-step-beginner-guide-secure-gemini-api-key)
5. [Step-by-Step Beginner Guide: Android Build & Keystore (.aab)](#step-by-step-beginner-guide-android-build--keystore-aab)
6. [Google Play Console & 12-Tester Rule](#google-play-console--12-tester-rule)
7. [What You Must Do Yourself](#what-you-must-do-yourself)
8. [Known Limitations & Roadmap](#known-limitations--roadmap)

---

## 1. Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons.
- **Mobile Container**: Capacitor for Android.
- **Backend / Database**: Google Firebase (Authentication, Cloud Firestore, Cloud Storage, Cloud Functions).
- **Offline Persistence**: Local IndexedDB + automatic sync queues.
- **AI Bill OCR**: Google Gemini 2.5 Flash via serverless Cloud Function (keys kept 100% private).
- **Internationalization**: Full bilingual English & Hindi (`hi-IN`) with Roman-Hindi phonetic search indexing ("chawal" $\to$ "Rice").

---

## 2. Local Setup & Running

### Prerequisites
- Node.js 20 or later
- npm or bun

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (currency, units, search, security simulation)
npm run test
# or: npx tsx --test src/utils/core.test.ts src/services/storageService.test.ts src/tests/firestoreRulesSimulation.test.ts

# 3. Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.
To inspect with pre-seeded demo data, open `http://localhost:3000/?autostart=1`.

---

## 3. Step-by-Step Beginner Guide: Firebase Setup

1. **Go to Firebase Console**:
   - Open [https://console.firebase.google.com](https://console.firebase.google.com) and click **Add Project**.
   - Enter a clean project name (e.g., `bharat-retail-stock`).
   - Enable Google Analytics (recommended) and click **Create Project**.

2. **Add a Web App & Android App**:
   - Click the Web icon (`</>`) to register a web app.
   - Click the Android icon to register an Android app:
     - **Android package name**: `in.vyaparstock.app` (or your chosen brand ID).
     - Download `google-services.json` and place it in `android/app/google-services.json`.

3. **Enable Firestore Database**:
   - In the left sidebar, click **Firestore Database** $\to$ **Create Database**.
   - Choose region: `asia-south1` (Mumbai) for fastest speed in India.
   - Start in **Production Mode**.
   - Deploy `firestore.rules` using Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```

4. **Enable Firebase Authentication**:
   - In the left sidebar, click **Authentication** $\to$ **Get Started**.
   - Enable **Google Sign-In** and **Phone Authentication** (for Indian SMS OTP).

5. **Enable Cloud Storage**:
   - In the left sidebar, click **Storage** $\to$ **Get Started**.
   - Select default bucket settings in `asia-south1`.

---

## 4. Step-by-Step Beginner Guide: Secure Gemini API Key

1. **Get your Gemini API Key**:
   - Open [Google AI Studio](https://aistudio.google.com/) $\to$ **Get API key**.
   - Create a key in your Google Cloud project.

2. **Store Key Safely in Cloud Secret Manager**:
   - Never place the key in client `.env` files or mobile code!
   - In your Firebase Functions directory:
     ```bash
     cd functions
     firebase functions:secrets:set GEMINI_API_KEY
     ```
   - Paste your key when prompted.
   - Deploy functions:
     ```bash
     firebase deploy --only functions
     ```

---

## 5. Step-by-Step Beginner Guide: Android Build & Keystore (.aab)

Google Play requires signed Android App Bundles (`.aab`) with target SDK 34 or higher.

### Step 5.1: Initialize Capacitor
```bash
npm run build
npx cap init "VyaparStock" "in.vyaparstock.app" --web-dir dist
npx cap add android
```

### Step 5.2: Create and Back Up Your Upload Keystore
Run this command in terminal to generate a secure keystore:
```bash
keytool -genkey -v -keystore vyapar-upload-key.jks \
  -alias vyapar-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```
> [!CAUTION]
> **CRITICAL**: Back up `vyapar-upload-key.jks` in TWO independent safe locations (e.g. encrypted cloud drive and external USB drive). If you lose this keystore, you will NEVER be able to update your app on Google Play!

### Step 5.3: Build the Signed `.aab`
In Android Studio:
1. Open the `/android` directory.
2. Select **Build** $\to$ **Generate Signed Bundle / APK**.
3. Choose **Android App Bundle (.aab)**.
4. Select `vyapar-upload-key.jks`, enter your password, and choose destination `release`.
5. Android Studio will generate `app-release.aab`.

---

## 6. Google Play Console & 12-Tester Rule

### What is the 12-Tester Rule?
Google Play mandates that personal developer accounts created after November 2023 must run a **closed test with at least 12 testers opted in for at least 14 days** before applying for production release.

### Action Checklist:
1. Open [Google Play Console](https://play.google.com/console).
2. Pay the one-time $25 registration fee.
3. Create App:
   - App name: VyaparStock (or your chosen brand)
   - Default language: English (India)
   - Free app
4. Complete Store Listing:
   - Short description (up to 80 chars)
   - Full description (highlighting kirana, hardware, medical, billing, udhaar, Hindi)
   - App Icon: 512x512 PNG
   - Feature Graphic: 1024x500 JPG/PNG
   - At least 4 phone screenshots (1080x1920)
5. Set up Closed Testing Track:
   - Create an email list of at least 12-20 friends/shopkeepers with Android phones.
   - Upload `app-release.aab`.
   - Send the opt-in web link to your 12 testers.
   - Keep them opted-in for 14 continuous days before requesting production access.

---

## 7. What You Must Do Yourself

1. **Google Play Developer Account**: Pay the one-time $25 fee to Google.
2. **Shop Owners / Testers**: Recruit 12 testers for the mandatory 14-day testing period.
3. **SMS Gateway (Optional)**: If using SMS OTP instead of Google Sign-In, configure Firebase Phone Auth SMS quotas.
4. **Custom Domain (Optional)**: If hosting the web companion app, link your custom domain in Firebase Hosting.

---

## 8. Known Limitations & Roadmap for Next Version

- **No Barcode Scanning**: Excluded intentionally in this version per design guidelines. Future versions can add camera barcode scanning as an optional plug-in for shops with barcoded inventory.
- **Multiple Branches / Multi-Shop Switcher**: Currently, each account manages one primary active shop. The database structure already includes `shopIds[]` to support multiple branches under one owner in v2.
- **Hardware Thermal Printer**: Web printing is standard; Bluetooth ESC/POS thermal printer direct pairing can be enabled via Capacitor Bluetooth plugin in v2.
