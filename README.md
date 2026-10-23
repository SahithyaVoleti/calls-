# TogetherSpace 🌌

**TogetherSpace** is a private, production-minded, real-time communication platform engineered specifically for **two authorized users**. It brings the high-fidelity calling experience of Zoom into an intimate, private sanctuary featuring peer-to-peer WebRTC video and voice calling, persistent real-time chat, and strict two-user security rules.

---

## 🌟 Key Features

- **Strict Two-User Allowlist**: Only the two designated email addresses configured by the owner can register, log in, view presence, or exchange messages and calls.
- **Genuine Peer-to-Peer WebRTC Calling**:
  - **HD Video Calling**: 720p/1080p peer-to-peer video with floating picture-in-picture local preview, camera toggling, and screen sharing.
  - **Voice-Only Calling**: Audio-only mode that **strictly never requests camera permissions**, with ambient audio wave pulses.
  - **No Artificial Call Timers**: No 40-minute cutoff or arbitrary meeting duration limit. Calls last as long as the participants want. (An informational call timer displays elapsed duration).
- **In-Call Controls & Seamless Multitasking**:
  - Toggle microphone mute/unmute.
  - Toggle camera on/off.
  - Switch to audio-only on the fly.
  - Expandable in-call chat panel so both users can exchange links and messages while talking.
- **Audio Sound Engine (Web Audio API)**:
  - Synthesized melodic incoming ringtone.
  - Outgoing dual-frequency ringback tone.
  - Ascending chime on call connect & descending chime on call end.
  - Gentle message notification ding.
  - 100% reliable with zero external MP3 network dependencies.
- **Real-Time Private Chat**:
  - Persistent message history backed by Cloud Firestore.
  - Auto-scroll with smart scroll-lock detection (floating "New messages ↓" pill when reading history).
  - Enter to send, Shift+Enter for new line, input character counter.
  - Unread message counters and delivery checkmarks.
- **Live Presence & Availability**:
  - Real-time online/offline indicators and last-seen timestamps.
  - In-call busy indicator preventing duplicate ringing.
  - Automatic cleanup and disconnect handling on window close (`beforeunload`).
- **Premium Navy & Violet Aesthetic**:
  - Responsive across desktop, laptops, Android, and iOS Safari.
  - Smooth glassmorphism, rounded cards, and dark/light mode toggle.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Auth & Database**: Firebase Authentication (Email/Password), Cloud Firestore
- **Signaling & Media**: WebRTC (`RTCPeerConnection`), Firestore Signaling Channel, STUN / TURN
- **Backend & Serverless**: Firebase Cloud Functions, Firestore Security Rules
- **Deployment**: Vercel (Frontend), Firebase (Backend Services)
- **Testing**: Vitest, React Testing Library, JSDOM

---

## 📁 Project Architecture

```
├── .env.example                # Template for environment variables
├── firestore.rules             # Strict two-user Firestore security rules
├── firestore.indexes.json      # Firestore composite indexes
├── firebase.json               # Firebase deployment configuration
├── functions/                  # Firebase Cloud Functions (cleanup & admin)
│   ├── index.js
│   └── package.json
├── scripts/
│   └── seed-allowlist.mjs      # CLI to seed authorized users into Firestore
├── src/
│   ├── components/
│   │   ├── call/               # Video/Voice overlays, controls, PIP preview
│   │   ├── chat/               # Chat panel, bubbles, input
│   │   ├── dashboard/          # Partner card, quick actions, profile modal
│   │   ├── layout/             # Navbar, layout wrapper
│   │   └── ui/                 # Accessible button, input, card, avatar, modal
│   ├── context/
│   │   ├── AuthContext.tsx     # Authentication and allowlist state
│   │   ├── CallContext.tsx     # WebRTC call state machine & media
│   │   ├── ChatContext.tsx     # Real-time messages & unread counts
│   │   ├── PresenceContext.tsx # Partner online/offline presence
│   │   └── ThemeContext.tsx    # Dark/Light mode toggle
│   ├── services/
│   │   ├── firebase.ts         # Firebase initialization
│   │   ├── authService.ts      # Authentication service
│   │   ├── webrtcService.ts    # WebRTC RTCPeerConnection manager
│   │   ├── signalingService.ts # Firestore call signaling & ICE exchange
│   │   ├── chatService.ts      # Message persistence
│   │   ├── presenceService.ts  # Online heartbeat & last-seen
│   │   └── soundService.ts     # Web Audio API sound synthesizer
│   ├── types/                  # TypeScript interface definitions
│   ├── utils/                  # Allowlist parser & helpers
│   └── test/                   # Vitest unit & integration test suites
```

---

## 🚀 Setup & Local Development Guide

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **pnpm**
- A free **Google Firebase** account

### 2. Install Dependencies
```bash
npm install
```

### 3. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**. Name it (e.g. `togetherspace-prod`).
2. **Enable Email/Password Authentication**:
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password** and click Save.
3. **Create Cloud Firestore Database**:
   - Go to **Build > Firestore Database > Create database**.
   - Choose a region close to both users (e.g., `nam5` or `eur3`).
   - Start in **Production mode**.
4. **Register Web App**:
   - In Project Settings > General, click the **Web icon (`</>`)** to add an app.
   - Copy the `firebaseConfig` keys into your `.env` file.

### 4. Configure the Two Authorized Email Addresses
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your `.env` file:
```env
# Enter the exactly two email addresses allowed to use TogetherSpace:
VITE_AUTHORIZED_EMAIL_1=first_person@example.com
VITE_AUTHORIZED_EMAIL_2=second_person@example.com

# Firebase Client Configuration:
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=togetherspace-prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=togetherspace-prod
VITE_FIREBASE_STORAGE_BUCKET=togetherspace-prod.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Optional WebRTC TURN Server (recommended for symmetric NAT / corporate firewalls):
VITE_TURN_URL=
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

### 5. Deploy Firestore Security Rules & Allowlist
Deploy the strict security rules so only these two accounts can read or write data:
```bash
npm install -g firebase-tools
firebase login
firebase use --add <your-project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

To seed the two authorized email addresses into the Firestore `authorized_users` collection:
```bash
node scripts/seed-allowlist.mjs first_person@example.com second_person@example.com
```
*(Alternatively, create documents in the Firebase Console under `authorized_users` where each document ID is the lowercase email, e.g., `first_person@example.com` with field `{ "email": "first_person@example.com", "role": "owner" }`)*.

### 6. Start the Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing

TogetherSpace comes with a complete Vitest suite covering authorization logic, chat validation, WebRTC constraints, and call-state transitions:

```bash
# Run unit and integration tests
npm test

# Run build verification
npm run build

# Run linter
npm run lint
```

### Testing Calling Between Two Users Locally
To test genuine peer-to-peer calling on a single computer:
1. Open [http://localhost:5173](http://localhost:5173) in your normal browser (e.g. Chrome) and sign in as `first_person@example.com`.
2. Open an **Incognito / Private Window** or a second browser (e.g. Firefox / Edge) and navigate to [http://localhost:5173](http://localhost:5173).
3. Sign in as `second_person@example.com`.
4. Observe the live presence indicator switch to **Available** with a pulsating green status dot.
5. Click **Video Call** or **Voice Call**:
   - The caller will hear the outgoing ringback tone.
   - The receiver will receive the incoming call banner with ring chime.
   - Click **Accept** to establish the encrypted direct WebRTC channel.
   - Verify that ending the call from either side stops all tracks and returns both clients to the dashboard.

---

## 🌐 Configuring STUN / TURN for High Reliability

WebRTC establishes direct peer-to-peer connections using STUN servers (`stun:stun.l.google.com:19302` is configured by default). In approximately 10-15% of mobile cellular or restrictive corporate networks (Symmetric NAT), direct P2P connections cannot be established without a **TURN relay server**.

To configure TURN:
1. Obtain free or low-cost TURN credentials from a provider such as:
   - [Metered.ca](https://www.metered.ca/) (Provides 50GB free TURN bandwidth/month).
   - [Twilio Network Traversal](https://www.twilio.com/docs/stun-turn).
   - [Xirsys](https://xirsys.com/).
   - Or deploy your own open-source [Coturn](https://github.com/coturn/coturn) instance.
2. In your deployment environment variables, add:
   ```env
   VITE_TURN_URL=turn:standard.relay.metered.ca:80
   VITE_TURN_USERNAME=your_turn_username
   VITE_TURN_CREDENTIAL=your_turn_password
   ```
3. TogetherSpace automatically attaches the TURN configuration to `RTCPeerConnection`.

---

## 🚢 Deploying to Vercel

1. Push your code to a private GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete TogetherSpace implementation"
   git remote add origin https://github.com/your-username/togetherspace.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your `togetherspace` repository.
4. Framework Preset: **Vite**.
5. In **Environment Variables**, add:
   - `VITE_AUTHORIZED_EMAIL_1`
   - `VITE_AUTHORIZED_EMAIL_2`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_TURN_URL` (optional)
   - `VITE_TURN_USERNAME` (optional)
   - `VITE_TURN_CREDENTIAL` (optional)
6. Click **Deploy**. Vercel will build and assign your production URL (e.g. `https://together-space.vercel.app`).

---

## 🔒 Security & Privacy Model

- **Firestore Rules Enforcement**:
  Every document in `users`, `conversations`, `messages`, and `calls` evaluates:
  ```cel
  exists(/databases/$(database)/documents/authorized_users/$(request.auth.token.email.lower()))
  ```
  Even if an unauthorized user inspects network calls or creates a Firebase account, Firestore completely rejects their queries with `permission-denied`.
- **Zero Admin Key Exposure**:
  No Firebase Admin service-account secrets or private keys exist in the frontend code.
- **Direct P2P Media**:
  Audio and video streams are transmitted directly between the two browsers via WebRTC (DTLS-SRTP encryption). Media never passes through or gets recorded on intermediate database servers.
- **Call Session Cleanup**:
  When a call concludes or if a tab closes, media tracks are stopped (`track.stop()`) and signaling documents are marked as `ended`. Scheduled Firebase Functions periodically clean up old signaling records.

---

## 🩺 Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Access Denied: This email address is not in the authorized two-user list"** | The account attempting to register or log in does not match `VITE_AUTHORIZED_EMAIL_1` or `VITE_AUTHORIZED_EMAIL_2`. | Verify that the email matches the environment variables configured in `.env` and seeded in `authorized_users`. |
| **"Microphone/Camera permission denied"** | The browser blocked media device permissions. | In the browser address bar, click the lock/settings icon next to the URL and set Camera and Microphone to **Allow**. |
| **Call stays in "Connecting..." state** | The two devices are on restrictive NAT/firewalls that block direct UDP packets. | Configure a TURN server via `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL`. |
| **No sound on mobile Safari / iOS** | iOS requires user interaction before playing audio context. | Tapping anywhere on the screen or clicking "Accept" initializes the Web Audio API synthesizer. |
| **Firebase permission-denied errors** | Firestore security rules haven't been deployed or the `authorized_users` collection is empty. | Run `firebase deploy --only firestore:rules` and run `node scripts/seed-allowlist.mjs <email1> <email2>`. |
