import type { SafeUser } from '../types/crm';

interface SeedAccountRecord extends SafeUser {
  passwordHash: string;
}

// Pre-seeded 10 NovaWorks Technologies accounts.
// Passwords are never exported outside auth verification.
const DEMO_PASSWORD = 'Demo123!';

const SEED_ACCOUNTS: ReadonlyArray<SeedAccountRecord> = [
  {
    id: 'ADMIN',
    name: 'Admin',
    email: 'admin@novaworks.example',
    role: 'ADMIN',
    specialization: 'Executive Operations',
    skills: ['Company overview', 'Transcript creation'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'PM01',
    name: 'Ayesha Khan',
    email: 'ayesha@novaworks.example',
    role: 'MANAGER',
    specialization: 'Web PM',
    skills: ['Web projects', 'Client coordination'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'PM02',
    name: 'Bilal Ahmed',
    email: 'bilal@novaworks.example',
    role: 'MANAGER',
    specialization: 'Mobile PM',
    skills: ['Mobile projects', 'Delivery planning'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'PM03',
    name: 'Hina Malik',
    email: 'hina@novaworks.example',
    role: 'MANAGER',
    specialization: 'AI PM',
    skills: ['AI projects', 'Requirement review'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV01',
    name: 'Ali Raza',
    email: 'ali@novaworks.e',
    alternateEmails: ['ali@novaworks.example'],
    role: 'AGENT',
    specialization: 'Full-Stack',
    skills: ['React', 'Frontend integration'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV02',
    name: 'Hamza Shah',
    email: 'hamza@novaworks.example',
    role: 'AGENT',
    specialization: 'Full-Stack',
    skills: ['Node.js', 'Databases', 'APIs'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV03',
    name: 'Sara Noor',
    email: 'sara@novaworks.example',
    role: 'AGENT',
    specialization: 'App Developer',
    skills: ['Flutter', 'Mobile UI'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV04',
    name: 'Usman Tariq',
    email: 'usman@novaworks.example',
    role: 'AGENT',
    specialization: 'App Developer',
    skills: ['Flutter', 'Integration', 'Testing'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV05',
    name: 'Zain Abbas',
    email: 'zain@novaworks.example',
    role: 'AGENT',
    specialization: 'AI Developer',
    skills: ['LLMs', 'Extraction', 'Prompts'],
    passwordHash: DEMO_PASSWORD,
  },
  {
    id: 'DEV06',
    name: 'Maryam Asif',
    email: 'maryam@novaworks.example',
    role: 'AGENT',
    specialization: 'AI Developer',
    skills: ['Retrieval', 'Document processing'],
    passwordHash: DEMO_PASSWORD,
  },
];

function sanitizeUser(record: SeedAccountRecord): SafeUser {
  const { passwordHash: _ignored, ...safe } = record;
  return {
    ...safe,
    skills: [...safe.skills],
    alternateEmails: safe.alternateEmails ? [...safe.alternateEmails] : undefined,
  };
}

export function getPublicTeamDirectory(): SafeUser[] {
  return SEED_ACCOUNTS.map(sanitizeUser);
}

export function findSafeUserById(userId: string): SafeUser | null {
  const match = SEED_ACCOUNTS.find((account) => account.id === userId);
  return match ? sanitizeUser(match) : null;
}

export function verifyAccountCredentials(emailInput: string, passwordInput: string): SafeUser | null {
  const normalizedEmail = emailInput.trim().toLowerCase();
  if (!normalizedEmail || !passwordInput) {
    return null;
  }

  const match = SEED_ACCOUNTS.find((account) => {
    const primaryMatch = account.email.toLowerCase() === normalizedEmail;
    const altMatch = account.alternateEmails?.some(
      (alt) => alt.toLowerCase() === normalizedEmail
    );
    return primaryMatch || Boolean(altMatch);
  });

  if (!match || match.passwordHash !== passwordInput) {
    return null;
  }

  return sanitizeUser(match);
}
