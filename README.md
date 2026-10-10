# 🏋️ Styrka — 5x5 Workout Journal & Strength Tracker

**Styrka** is a tactile, linear progression workout journal designed for the gym. Built for lifters following 5x5 (StrongLifts style) with full flexibility to swap barbell and dumbbell variations, discreet form guides for partners/beginners, automatic workout cycling, and persistent cloud backup via SQLite.

Part of the **Harkco Daily Apps** suite.

---

## ✨ Features

- **Linear 5x5 Progression & Auto-Cycling**:
  - Automatically suggests your next workout in the sequence (e.g. Workout A -> Workout B -> Workout A).
  - Progressive overload suggestions: auto-suggests `+2.5 kg` (or `+5 kg` for Deadlifts) if all sets were completed in the last session.
- **Barbell & Dumbbell Flexibility**:
  - Swap any movement with 1-click (e.g. *Barbell Bench Press* ⇄ *Dumbbell Bench Press*, *Back Squat* ⇄ *Goblet Squat*, *Barbell Row* ⇄ *One-Arm Dumbbell Row*).
  - Preserves weight history per exercise variation.
- **Discreet Form Guides & Instructions**:
  - Tapping **"📖 Guide"** on any exercise reveals a clean modal with step-by-step setup, execution, breathing/bracing cues, and common mistakes to avoid.
  - Includes dedicated home & dumbbell tips for partners or beginners learning form.
- **Gym-Optimized Tactile Logger**:
  - Big tap targets for sweaty fingers: tap set bubbles to check off `5` reps, tap again to step down (`4`, `3`, `2`, `1`, `Miss`).
  - Auto rest timer countdown with pleasant chime sound when rest is over.
  - Barbell plate calculator: tap any weight to see the exact Olympic bar (20kg) and plate stack per side.
- **Persistent SQLite Database & Opt-In Sync**:
  - Offline-first: works 100% out of the box with zero sign-up required (stored locally).
  - Simple opt-in cloud sync with username + 4-digit PIN.
  - Multi-profile switching (e.g. switch between "Viktor" and "Anna" on shared or separate devices).
- **History & PR Analytics**:
  - Estimated 1RM calculator (Epley formula).
  - Personal record (PR) celebration badges and volume tracking.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js 22, `node:sqlite` (native SQLite database), `sirv` static server.
- **Deployment**: Docker on Coolify (`https://styrka.apps.harkco.se`).

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server with SQLite DB
npm start
```
