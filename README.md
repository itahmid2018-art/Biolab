# BioFocus Learning Studio ⚛️🧬

> **A Minimalist, Socratic Bioscience & Macromolecular Learning Platform**  
> Inspired by Google Search clarity and guided by virtual AI mentors, BioFocus brings foundational biochemistry, genetics, and cell physiology to life through interactive 2D/3D molecular visualization and structured study roadmaps.

---

## 📋 Table of Contents
1. [Project Objectives & Philosophy](#-project-objectives--philosophy)
2. [Core Feature Architecture](#-core-feature-architecture)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Installation & Setup](#-installation--setup)
5. [Local Development & Testing](#-local-development--testing)
6. [Interactive Bioscience Study Roadmap](#-interactive-bioscience-study-roadmap)
7. [Comprehensive Security Audit & CSR Analysis](#-comprehensive-security-audit--csr-analysis)
   - [Client-Side Rendering (CSR) Security Profile](#1-client-side-rendering-csr-security-profile)
   - [DOM-Based Cross-Site Scripting (XSS) Prevention](#2-dom-based-cross-site-scripting-xss-prevention)
   - [API Proxy & Secret Zero-Leakage Architecture](#3-api-proxy--secret-zero-leakage-architecture)
   - [Cross-Site Request Forgery (CSRF) Protection](#4-cross-site-request-forgery-csrf-protection)
   - [Content Security Policy (CSP) Directives](#5-content-security-policy-csp-directives)
   - [LocalStorage & Client State Sanitization](#6-localstorage--client-state-sanitization)
   - [WebGL & 3D Canvas Sandboxing](#7-webgl--3d-canvas-sandboxing)
8. [License & Data Provenance](#-license--data-provenance)

---

## 🎯 Project Objectives & Philosophy

Modern biological science is often taught through static 2D textbook drawings or overwhelming, ad-heavy portals. **BioFocus Learning Studio** was created with the following principles:

1. **Distraction-Free Minimalist UI**: An uncluttered, Google-search-style aesthetic where tools and menus remain docked as icons on the perimeter until needed.
2. **Instant 2D & 3D Molecular Inspection by Default**: Whenever a molecular topic is searched (e.g., *Sugar*, *Methane*, *Human DNA*, *GFP*, *Insulin*, *Hemoglobin*), high-fidelity 2D chemical diagrams and interactive 3D WebGL structures are rendered immediately with labeled functional groups.
3. **Socratic AI Pedagogy**: Rather than simply giving answers, virtual AI mentors (such as *Sofia Carter*, *Dr. Alex Morales*, and *Luna Chen*) ask probing questions adapted to the learner's reading grade (Grades 2-4, Grades 5-7, or Grades 8+).
4. **Structured Pedagogical Progression**: The *Study Roadmap* flowchart organizes bioscience concepts into logical tiers—guiding students from single tetrahedral carbon bonds to complex adaptive immune antibodies.
5. **Multi-Sensory Study Modalities**: Features NotebookLM-style synthesized summaries, dual-speaker podcast audio dialogues (using the Web Speech API), interactive mind maps, retention quizzes, and a gamified *Learning Passport*.

---

## 🌟 Core Feature Architecture

### 1. Minimal Google-Search Landing & Top Ask Feature
- **Minimal Landing**: A clean search entry point featuring quick exploration chips (*Sugar*, *Methane*, *DNA Double Helix*, *Insulin*).
- **Contextual Top Ask Feature**: Located immediately below the top navigation bar once search results appear, giving instant access to Socratic questioning and prompt suggestions.
- **Pinned Perimeter Tool Dock**: Floating, icon-only drawer buttons to the right provide quick access to:
  - 💬 **Virtual Tutor Companion** (Active character dialog)
  - 🧬 **3D Macromolecule Lab** (Coordinate-level residue inspection)
  - 📝 **Retention Challenge** (Adaptive quizzes with AI evaluation)
  - 🏆 **Learning Passport** (XP ledger, day streak, and badge achievements)
  - 🗺️ **Bioscience Study Roadmap** (Interactive flowchart and prerequisite tracker)

### 2. Molecular Structure Hero (2D & 3D by Default)
- **Small Molecules (PubChem Integration)**:
  - **Methane ($CH_4$)**: Tetrahedral $sp^3$ ball-and-stick geometry with precise $109.5^\circ$ bond angles.
  - **Sugar / D-Glucose ($C_6H_{12}O_6$)**: Six-membered pyranose ring with labeled hydroxyl groups ($-OH$) and hemiacetal ether bridges.
- **Macromolecules (RCSB PDB Integration)**:
  - **Human DNA B-Form ($1BNA$)**: Antiparallel sugar-phosphate rails and complementary A-T / G-C base pairs.
  - **Green Fluorescent Protein ($1EMA$)**: 11-strand beta-barrel and glowing chromophore triad (*Ser65-Tyr66-Gly67*).
  - **Insulin Hormone ($1TRZ$)**: Stored hexamer with zinc coordination and active monomer keys stabilized by disulfide bridges.
  - **Antibody IgG ($1IGT$)**: Flexible Y-shaped shield with Fab antigen-binding clamps and Fc effector handles.

### 3. Cellular, Organelle & Tissue 3D/2D Inspector (Orbitals Architecture)
Inspired by orbital and structural visualizer concepts (such as the *Orbitals* project), BioFocus extends beyond isolated molecules into living cellular and tissue models:
- **Multipolar Motor Neuron (`neuron-cell`)**:
  - **3D Spatial Mesh**: Soma cell body with displaced membrane, nucleus, dendritic arborization with receptive micro-spines, axon hillock, myelinated axon with segmented Schwann cell wraps, and distal synaptic terminal boutons.
  - **Real-Time Action Potential Simulation**: Propagating $+35\text{ mV}$ electrical depolarization wave jumping along Nodes of Ranvier via $120\text{ m/s}$ saltatory conduction.
  - **Interactive Cutaway & Exploded View**: Depth sliders (0-100%) to peel back the phospholipid myelin sheath and expose underlying axoplasm and ion channels.
  - **2D Anatomical Schematic**: Labeled interactive hotspot pins with live physiological readouts ($-70\text{ mV}$ resting potential, ~10,000 synaptic inputs).
- **Mitochondrion Bioenergetic Powerhouse (`mitochondria-organelle`)**:
  - **3D Double-Membrane Cutaway**: Outer membrane studded with VDAC porin channels, intermembrane proton reservoir, deeply folded cristae sheets, viscous matrix, and circular double-stranded mtDNA plasmids.
  - **Active $F_0F_1$ ATP Synthase Nanomotors**: Membrane-embedded rotary turbines spinning at 6,000 RPM as $H^+$ protons rush across the electrochemical gradient ($\Delta \text{pH } 1.4$).
  - **Bioenergetics Boost**: Interactive toggle to accelerate ATP generation and stream proton particle cascades.
- **Microscopic Compartments Breakdown**: Comprehensive breakdown cards with anatomical location, cellular role, scale/dimensions, and direct Socratic Q&A hooks to Sofia Carter.

### 4. Study Roadmap Flowchart & Next-Topic Engine
- Visual flowchart linking foundational concepts across 7 tiers (from Methane and Glucose to Mitochondria and Motor Neurons).
- Node statuses: **Mastered** (green checkmark, score $\ge 70\%$), **In Progress** (active study), **Recommended Next** (pulsing badge), and **Locked** (prerequisite required).
- Contextual tutor recommendations explaining *why* a topic should be explored next.

---

## 🏗️ System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│  React 19 SPA + Vite + Tailwind CSS (Google-style minimal)  │
│  ├── 3Dmol.js (WebGL Macromolecular Engine)                 │
│  ├── Canvas-Confetti (Gamification Celebrations)             │
│  └── Web Speech API (Socratic Tutor Voice Synthesis)        │
└───────────────▲─────────────────────────────▲───────────────┘
                │                             │
    Client JSON Requests              Direct Static Assets
    (Stateless /api/*)                (Vite Dev Middleware)
                │                             │
┌───────────────▼─────────────────────────────▼───────────────┐
│              Full-Stack Express Proxy (server.ts)           │
│  ├── /api/tutor/chat       -> Google Gemini API (Server)    │
│  ├── /api/topics/ai-explore -> Socratic Curriculum Engine   │
│  ├── /api/quiz/evaluate    -> Real-Time Formative Feedback  │
│  └── /api/pdb/* & /api/pubchem/* -> Cached Molecular Proxy  │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│    Google Gemini API    │           │  RCSB PDB & PubChem DB  │
│  (API Key stored only   │           │  (Atomic coordinate &   │
│   in server environment)│           │   curated structures)   │
└─────────────────────────┘           └─────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, 3Dmol.js.
- **Backend**: Node.js, Express, `tsx` runtime, `@google/genai` TypeScript SDK.
- **Port**: Runs on port `3000` (development and production).

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **pnpm**
- **Google Gemini API Key** (optional for AI generation; offline curated fallbacks are included)

### Step 1: Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd biofocus-learning-studio

# Install all dependencies
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```
Populate the `.env` file with your credentials:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```
> **Security Note**: Never commit your `.env` file with actual secrets to version control. The client build never bundles `GEMINI_API_KEY`.

---

## 🧪 Local Development & Testing

### Running the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

### Production Build
```bash
# Compile and bundle with Vite
npm run build

# Start the full-stack server in production mode
npm start
```

### Automated Code Verification
Run TypeScript type-checking and lint validation:
```bash
npm run lint
```

### Manual QA Verification Suite
Execute the following verification test scenarios locally:

| Test Case | Steps to Execute | Expected Result |
| :--- | :--- | :--- |
| **TC-01: Sugar Search & 2D/3D** | Enter `Sugar` or `Glucose` in search bar and press Enter. | Topic loads with $C_6H_{12}O_6$ formula, 2D/3D structure hero, pyranose ring description, and 5 labeled hydroxyl groups. |
| **TC-02: Methane Molecular Geometry** | Enter `Methane` or `CH4` in search bar. | Tetrahedral 3D ball-and-stick model renders with $109.5^\circ$ bond angles and non-polar symmetry callout. |
| **TC-03: DNA Double Helix Structure** | Enter `DNA` or `Human DNA` in search bar. | PDB $1BNA$ double helix renders with labeled A-T / G-C base pairs and sugar-phosphate rails. |
| **TC-04: Study Roadmap Navigation** | Click the 🗺️ Roadmap icon in top bar or right dock. | Flowchart renders 5 tiers. Mastered topics show green checkmarks; recommended next topic pulses with Sofia Carter's guidance. |
| **TC-05: Socratic Ask Feature** | Ask a question via the top bar (e.g., *"Why does sugar dissolve in water?"*). | Sofia responds Socratically with citation highlights, reading-level adaptation, and voice synthesis support. |
| **TC-06: Retention Quiz & XP** | Click 📝 Quiz in right panel, answer question, submit. | Instant feedback provided, XP awarded, and confetti fires on badge milestone. |

---

## 🗺️ Interactive Bioscience Study Roadmap

The study curriculum is structured as a Directed Acyclic Graph (DAG) across 5 pedagogical tiers:

```
[Tier 1: Foundations]
   Methane (CH4) ───────┐
                        ▼
[Tier 2: Bio-Energy]  Sugar / Glucose (C6H12O6)
                        │
         ┌──────────────┴──────────────┐
         ▼                             ▼
[Tier 3: Blueprint]            [Tier 4: Hormones]
   DNA Double Helix (1BNA)        Insulin Key (1TRZ)
         │                             │
         ▼                             ▼
[Tier 4: Optics]               [Tier 5: Physiology]
   GFP Jellyfish (1EMA)           Hemoglobin Submarine (1A3N)
         │                             │
         └──────────────┬──────────────┘
                        ▼
[Tier 5: Immunity]    Antibody IgG Shield (1IGT)
```

The recommendation engine continuously evaluates prerequisite completion and guides learners to their next optimal discovery.

---

## 🔒 Comprehensive Security Audit & CSR Analysis

Security is built into the architecture. Below is a detailed assessment of the security model, specifically addressing **Client-Side Rendering (CSR)**, DOM-based attacks, API protection, and resource sandboxing.

### 1. Client-Side Rendering (CSR) Security Profile

| CSR Attribute | Security Impact | Implementation in BioFocus |
| :--- | :--- | :--- |
| **Client Rendering Pipeline** | Unlike Server-Side Rendering (SSR), CSR does not render user strings into raw HTML templates on a server, eliminating Server-Side Template Injection (SSTI). | React 19 handles all DOM rendering via virtual DOM elements, preventing direct string concatenation into the document. |
| **State Hydration Vulnerabilities** | SSR applications often serialize state into `window.__INITIAL_STATE__`, creating script escape vulnerabilities (`</script><script>`). | No serialized HTML state injection is used; all application state is initialized via client-side React hooks and verified JSON payloads. |
| **Client-Side Routing & View Transitions** | Views transition dynamically inside the client without page reloads. | Query parameters and search terms are handled via sanitized React state rather than evaluating dynamic eval or unsafe URL navigators. |

### 2. DOM-Based Cross-Site Scripting (XSS) Prevention

- **JSX Automatic Escaping**: All dynamic text—including topic summaries, chemical formulas, user questions, and AI dialogue turns—is passed as children to JSX elements (`<span>{text}</span>`). React automatically escapes characters (`<`, `>`, `&`, `"`, `'`), rendering them safely as text nodes.
- **Zero Raw HTML Injection**: The application strictly avoids `dangerouslySetInnerHTML`. No unescaped user or external model input is ever injected directly into the DOM tree.
- **Safe Link Attributes**: External scientific provenance links (such as to RCSB PDB and PubChem) strictly enforce `rel="noopener noreferrer"` and `target="_blank"` to prevent window opener hijacking (`window.opener`).

### 3. API Proxy & Secret Zero-Leakage Architecture

- **Backend Proxy Boundary**: All external calls to the Google Gemini API are mediated exclusively through the Express backend proxy (`server.ts`).
- **No Client-Side API Keys**:
  - The client bundle built by Vite does not contain `GEMINI_API_KEY` or any environment secret.
  - Client queries call local proxy endpoints (`POST /api/tutor/chat`, `POST /api/topics/ai-explore`, `POST /api/quiz/evaluate`).
  - If a user opens browser DevTools, network inspection reveals only calls to `/api/*`; no Google credentials are ever exposed.
- **Input Validation & Body Parsing**: Express routes enforce `express.json({ limit: '1mb' })`, preventing denial-of-service via payload exhaustion.

### 4. Cross-Site Request Forgery (CSRF) Protection

- **Stateless REST / JSON APIs**: All backend endpoints require `Content-Type: application/json`.
- **Pre-flight & MIME Enforcement**: Standard HTML form submissions (`application/x-www-form-urlencoded` or `multipart/form-data`) cannot trigger JSON endpoints without a CORS pre-flight, protecting users against cross-origin drive-by CSRF attacks.
- **Zero Sensitive Cookies**: Authentication profiles and gamification progress are managed securely in local client state, so no ambient session cookies exist to be hijacked.

### 5. Content Security Policy (CSP) Directives

For production deployments, the following Content Security Policy (CSP) headers are recommended:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://data.rcsb.org https://files.rcsb.org https://pubchem.ncbi.nlm.nih.gov;
  worker-src 'self' blob:;
  frame-ancestors 'self';
  object-src 'none';
  base-uri 'self';
```

> *Note*: `'unsafe-eval'` in `script-src` is required only by the WebGL shader compiler inside `3Dmol.js` to compile GLSL shaders on the GPU.

### 6. LocalStorage & Client State Sanitization

- **Safe JSON Deserialization**: All reads from `localStorage` (`biofocus_student_progress`, `biofocus_active_user`, `biofocus_dark_mode`) are wrapped in `try/catch` defensive blocks with verified fallbacks (`DEFAULT_PROGRESS`). Corrupted or manipulated values gracefully reset to defaults rather than causing crashes.
- **Type Guard Validation**: Restored user profile data is validated against the `UserProfile` schema before being applied to the application context.

### 7. WebGL & 3D Canvas Sandboxing

- **Memory Leak Protection**: The 3Dmol viewer lifecycle is bound to React `useEffect` hooks. When switching topics, existing WebGL contexts, geometry buffers, and event listeners are properly disposed of.
- **CORS-Compliant Coordinates**: Molecular structure files (`.pdb` and `.sdf`) are retrieved from authenticated HTTPS endpoints or bundled curated coordinate datasets, preventing tainted canvas security exceptions.
- **No Direct System Access**: WebGL rendering operates strictly within an isolated HTML `<canvas>` element without access to device hardware outside standard GPU graphics pipeline boundaries.

---

## 📜 License & Data Provenance

- **Molecular Structures**:
  - RCSB Protein Data Bank (PDB): Structures `1EMA` (GFP), `1A3N` (Hemoglobin), `1BNA` (B-DNA), `1TRZ` (Insulin), `1IGT` (Immunoglobulin G) are licensed under CC0 1.0 Universal Public Domain.
  - NCBI PubChem: Compound coordinates for Glucose (`CID 5793`) and Methane (`CID 297`) are curated from the National Library of Medicine.
- **Codebase License**: MIT License. Designed and engineered for high-impact educational bioscience learning.
