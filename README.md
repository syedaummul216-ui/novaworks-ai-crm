NovaWorks Technologies CRM — AI Project Manager (The Infinity Hack '26)

Team & Project Info
- Project Name: NovaWorks Technologies CRM (Meeting to Execution)
- Team Members: Syeda Ummal khair, Muhammad Abdullah , Sania Zahra
- Live Application Link: https://novaworks-technologies-crm.ai.studio/
- Demo Video Link: [Google Drive screen-recording link yahan paste karein]

Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, Vite
- AI Integration: OpenRouter API (`openrouter/free` with automatic free-model fallback)
- Storage & Auth: Browser `localStorage` persistence with session-based Role-Based Access Control (RBAC)

 Working Features
1. Role-Based Login & Access Control: Enforced in the service/data layer (Admin sees all projects & transcript generator; Managers see only their assigned projects; Agents see only their assigned tasks).
2. AI Meeting-to-Execution: Converts raw meeting transcripts into structured projects and tasks, applying mid-meeting revisions while filtering out rejected features and external non-employees.
3. AI Extraction & Guardrail Audit: Displays applied revisions, excluded scope, and ignored non-employees, along with directory skill-match badges on tasks.
4. Validation, Atomic Save & Inline Editing: Validates manager IDs, agent IDs, positive hours, and task deadlines (`<= project deadline`) before saving; allows Admin/Manager inline task editing and one-click project brief copying.
5. Read-Only Team Directory: Displays all 10 NovaWorks employees, roles, specializations, and skills.

Setup & Run Commands (Local)
```bash
npm install
npm run dev
