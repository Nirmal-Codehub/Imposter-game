# IMPOSTER — Real-Time Multiplayer Social Deduction Party Game

> *"Everyone knows something. Nobody knows everything."*

IMPOSTER is a fast-paced, real-time social deduction party game built for web browsers across desktop, tablets, and mobile devices. Players join anonymously using a public URL and a 6-character room code with zero app installation or account sign-up required.

---

## 🎮 Core Game Mechanics

1. **Secret Contrasting Questions**:
   - The game host selects or customizes two contrasting questions:
     - **Common Question**: Sent secretly to all normal players.
     - **Imposter Question**: Sent secretly to exactly one player (the Imposter).
   - Example:
     - *Common Question*: *"Who is most likely to quit their job without notice?"*
     - *Imposter Question*: *"Who is most likely to get employee of the month?"*
2. **Private Question Assignment & Answering**:
   - Each player sees only their assigned question. Questions are never labeled as "common" or "imposter" on player screens.
   - Players privately submit their answer by selecting or typing a fellow player's name.
   - Answers remain encrypted and hidden until all players have submitted.
3. **Simultaneous Reveal & Clues**:
   - Once all answers are locked (or forced by the host), both questions and all answers are revealed simultaneously.
   - The imposter's identity remains completely concealed!
4. **Verbal Discussion**:
   - An animated circular countdown timer (configurable, default 120s) guides debate.
   - The room investigates who gave an answer that only fits Question B.
5. **Private Voting & Elimination**:
   - Players cast a secret ballot for the suspect they believe is the Imposter (self-voting disabled).
   - The player receiving the most votes is eliminated.
   - **Tiebreaker Rule**: If multiple players tie for top votes, an emergency 45-second debate and a revote between only the tied suspects occurs. If the revote is still tied, the imposter escapes!
6. **Transparent Scoring System**:
   - **+2 Points**: Non-imposter who voted for the actual Imposter.
   - **-1 Point**: Non-imposter who voted for an innocent player.
   - **+3 Points**: Imposter avoids elimination and escapes.
   - **0 Bonus Points**: Imposter is caught.
   - **-2 Points**: Innocent player falsely accused and eliminated.
   - **+1 Point**: Team Success Bonus for all correct voters if the Imposter is caught.
7. **Cumulative Leaderboard & Multi-Round Play**:
   - Results display a complete audit of points and why each was awarded/deducted.
   - Leaderboard preserves points across rounds. Host can start Round 2, 3, etc. with new questions and fresh roles.

---

## 🔒 Security & Multiplayer Architecture

- **Server-Authoritative State Engine**:
  - The server holds the canonical state. Clients only receive sanitized state projections.
  - Secret roles, opposing questions, and unrevealed answers are stripped before network broadcast.
- **Anonymous Session Tokens**:
  - Players are issued random cryptographic session tokens stored in `sessionStorage` / `localStorage`.
  - Reconnection is automatic if a player refreshes their browser or briefly drops connection.
- **Host Protection**:
  - Critical actions (starting rounds, revealing answers, pausing timer, kicking players, next round) require host authorization.

---

## 🗄️ Supabase PostgreSQL Schema & Row Level Security (RLS)

A complete SQL migration script is located at `src/lib/supabase-schema.sql` (and accessible directly inside the app via the **Supabase RLS** button in the header).

### Key Tables:
1. `games`: Room code, room name, host ID, current game phase, settings JSONB.
2. `players`: Player UUID, game UUID, display name, avatar, session token, cumulative score.
3. `rounds`: Round number, common question, imposter question, timer remaining.
4. `player_private_roles`: **RLS Protected** — normal players can only query their own row until phase is `RESULTS`.
5. `answers`: **RLS Protected** — answers are unreadable by peers until phase reaches `REVEAL`.
6. `votes`: **RLS Protected** — secret ballots are unreadable by peers until phase reaches `RESULTS`.
7. `round_scores`: Transparent breakdown of points, score deltas, and reason strings.

---

## 🚀 Setup & Local Development

### Prerequisites:
- Node.js 18+ or 20+
- npm or pnpm

### Run Locally:
```bash
# Install dependencies
npm install

# Start full-stack dev server (Express + WebSockets + Vite)
npm run dev
```

Visit `http://localhost:3000` in your browser. Open multiple incognito windows or devices on the same local network to test real-time multiplayer!

---

## 🌐 Free-Tier Deployment (Supabase + Vercel / Cloud Run)

### Option A: Immediate Preview Deployment (AI Studio / Cloud Run)
- Dev URL: `https://ais-dev-ao3aju55r73wadx2cxlya6-616985352149.asia-southeast1.run.app`
- Shared Public URL: `https://ais-pre-ao3aju55r73wadx2cxlya6-616985352149.asia-southeast1.run.app`

### Option B: Deploying to Vercel (Hobby Free Plan) + Supabase
1. **Supabase Database Setup**:
   - Go to [supabase.com](https://supabase.com) and create a free project.
   - Go to the **SQL Editor**, paste the contents of `src/lib/supabase-schema.sql`, and click **Run**.
2. **GitHub Repository**:
   - Push this codebase to a GitHub repository.
3. **Vercel Hobby Deployment**:
   - Go to [vercel.com](https://vercel.com) and import the GitHub repository.
   - Framework preset: Vite / Node.
   - Build command: `npm run build`.
   - Output directory: `dist`.
   - Start command: `npm run start`.
4. **Environment Variables**:
   - `PORT=3000`
   - `NODE_ENV=production`

---

## 📱 Supported Devices
- iPhone & Android Mobile Browsers (Chrome, Safari, Firefox, Edge)
- iPad & Android Tablets
- Desktops and Laptops
- Fully responsive touch-first UI with vibration cues & Web Audio synthesized feedback
