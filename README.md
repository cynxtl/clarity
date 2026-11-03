# Clarity — Documentation Quality & Engineering Platform

Clarity is an enterprise documentation quality and engineering platform. It helps engineering and technical writing teams analyze, improve, validate, and maintain technical documentation with deterministic AST quality checks, modular validation engines, real-time writing diagnostics, and developer workflow automation.

---

## Key Features (Phase 1)

### 1. Application Shell & Visual Design
- **Dark-First Developer SaaS Interface:** Inspired by the disciplined design language of Linear and Vercel. Deep charcoal and slate surfaces (`#090a0f`, `#11131a`, `#171a23`), restrained violet accents (`#7c3aed`), subtle borders, crisp typography, and consistent spacing.
- **Complete Light Theme:** Seamless toggle with persisted preferences and neutral slate tokens.
- **Workspace Switcher:** Rapidly switch between multiple documentation workspaces or trigger sample demonstrations.
- **Responsive Layout:** Sidebar navigation, dynamic header with breadcrumbs, quick search palette shortcut (`Cmd+K` / `Ctrl+K`), and live engine status indicators.

### 2. Repository Management & Safe ZIP Import
- **Workspace Isolation:** Create custom workspaces stored in sandboxed directories.
- **Safe ZIP Extraction Engine (`SafeZipExtractor`):**
  - **Directory Traversal Protection:** Validates canonical paths to prevent `../` or absolute path escapes.
  - **Prohibited File Filtering:** Rejects executable binaries (`.exe`, `.bat`, `.sh`, `.cmd`, `.dll`, etc.).
  - **Sensible Size Limits:** Enforces max 25MB archive size, 5MB max single file limit, 50MB max total extracted size, and 600 max file count.
  - **Supported Asset Ingestion:** Extracts Markdown (`.md`, `.markdown`, `.mdx`, `.txt`), visual assets (`.png`, `.jpg`, `.svg`, `.webp`), and configs (`.json`, `.yaml`, `.yml`).
- **Realistic Sample Documentation Repository:** 1-click seeding of the complete **Nexus Cloud Platform** reference repository containing realistic guides, API specs, diagrams, and intentional validation scenarios for instant evaluation.
- **Navigable File Explorer:** Inspect file trees, extensions, line counts, word counts, byte sizes, and raw markdown content.

### 3. Deterministic Documentation Scanner & Rules Engine
Clarity implements independent, testable Python validation rules. Every violation includes an issue ID, rule ID, severity (`error`, `warning`, `info`), file path, line number, diagnostic explanation, detected snippet, and an actionable suggested fix.

| Rule ID | Rule Name | Category | Default Severity | Description |
|---|---|---|---|---|
| `HEAD-001` | Missing Document H1 | Structure | `error` | Flag files without a top-level `# Title` heading. |
| `HEAD-002` | Multiple H1 Headings | Structure | `warning` | Flag multiple H1 headings within a single document. |
| `HEAD-003` | Skipped Heading Level | Structure | `warning` | Flag heading skips (e.g. H1 followed directly by H3). |
| `HEAD-004` | Duplicate Heading Text | Structure | `warning` | Flag identical heading titles in the same file to prevent anchor collisions. |
| `LNK-001` | Broken Relative Markdown Link | Links | `error` | Resolves relative target links against repository files; flags missing targets. |
| `IMG-001` | Missing Local Image Asset | Assets | `error` | Resolves relative image paths against the asset tree; flags missing files. |
| `IMG-002` | Missing Image Alt Text | Accessibility | `warning` | Flags image elements with missing or whitespace-only alt descriptions. |
| `CODE-001` | Missing Code Fence Language | Style | `warning` | Flags unannotated code blocks (` ``` ` without syntax tag). |
| `STRUC-001` | Missing Required Sections | Structure | `warning` | Checks for configured standard sections (e.g. Overview, Prerequisites). |
| `TERM-001` | Glossary Inconsistency | Style | `warning` | Flags non-standard or deprecated terms (e.g. whitelist, depreciated, on-premise). |
| `LEN-001` | Excessively Long Paragraph | Style | `warning` | Flags dense paragraphs exceeding 150 words. |
| `LEN-002` | Excessively Long Sentence | Style | `info` | Flags complex sentences exceeding 35 words. |

### 4. Deterministic Scoring Model
Scores are calculated using a transparent, documented mathematical formula:
- **Base Score:** 100.0
- **Severity Deductions:** Error = -10.0 pts, Warning = -3.0 pts, Info = -0.5 pts
- **Normalization Factor:** Scaled against document volume (`max(1.0, total_files * 0.35)`) to prevent disproportionate skew in large repositories.
- **Quality Grades:**
  - `A+` (95.0 – 100.0): Exceptional documentation compliance.
  - `A` (90.0 – 94.9): Production standard; minimal non-blocking warnings.
  - `B` (80.0 – 89.9): Good structure; minor style or link adjustments needed.
  - `C` (70.0 – 79.9): Several broken links or hierarchy issues.
  - `D` (60.0 – 69.9): Substantial structural or reference errors.
  - `F` (< 60.0): Critical missing assets and structural failures.
- **Sub-scores:** Category breakdowns for **Structural Hierarchy**, **Links & Assets Health**, and **Style & Terminology**.

---

## Architecture & Technology Stack

```
clarity/
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # Typed REST endpoints (workspaces, scans, files, rules, dashboard)
│   │   ├── core/              # Security sandboxes and SafeZipExtractor
│   │   ├── models/            # SQLAlchemy models (SQLite/PostgreSQL DAL)
│   │   ├── rules/             # Modular validation rule implementations and registry
│   │   ├── schemas/           # Pydantic v2 data transfer schemas
│   │   ├── services/          # Business logic: workspace, scan, scoring, sample generator
│   │   └── config.py          # Environment settings and storage limits
│   └── tests/                 # Automated pytest suite covering 100% of rules and APIs
├── frontend/                  # React 19 + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/        # UI primitives (Card, Badge, Button, Modal, Input)
│   │   ├── context/           # WorkspaceContext and ThemeContext
│   │   ├── services/          # Typed API client
│   │   ├── views/             # 7 Application navigation views
│   │   └── test/              # Vitest test suite with @testing-library/react
│   └── package.json
├── pytest.ini                 # Pytest configuration
├── README.md                  # System overview and manual
└── PROJECT_STATUS.md          # Completed features and roadmap
```

---

## Getting Started

### Prerequisites
- **Python:** 3.11+
- **Node.js:** 20+
- **npm:** 10+

---

### Backend Setup

1. **Navigate to the backend directory and activate the virtual environment:**
   ```bash
   cd backend
   # Windows PowerShell:
   .\venv\Scripts\Activate.ps1
   # macOS / Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI backend server:**
   ```bash
   uvicorn backend.app.main:app --reload --port 8000
   ```
   - API Documentation (Swagger UI): `http://localhost:8000/api/docs`
   - API Health Check: `http://localhost:8000/api/health`

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Run the production build:**
   ```bash
   npm run build
   ```

---

## Running Automated Tests

### Backend Test Suite (Pytest)
Run all 24 automated tests covering every rule, zip traversal defense, scoring formula, and API endpoint:
```bash
backend/venv/Scripts/pytest
```

### Frontend Test Suite (Vitest)
Run the component test suite:
```bash
cd frontend
npm run test
```

---

## Future Roadmap (Phase 2 & 3)

The following features have interface hooks and architecture ready:
- **AI-Assisted Writing & Diff Review:** Context-aware grammar and tone improvements with side-by-side diff acceptance controls.
- **Semantic Vector Search (RAG):** FAISS-powered vector search across documentation repositories with natural language retrieval and citations.
- **GitHub Actions Quality Gate:** Native CI check to block pull requests introducing broken relative links or missing images.
- **OpenAPI Drift Detection:** Cross-referencing endpoint markdown against live OpenAPI / Swagger schemas.
