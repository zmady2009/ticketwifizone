/**
 * Parser CSV pour l'import de tickets MikroTik User Manager.
 *
 * Formats CSV acceptés :
 *
 * Format 1 (simple) :
 *   username,password
 *   wifi_a3k9m2,pass123
 *
 * Format 2 (avec headers) :
 *   username,password,profile
 *   wifi_a3k9m2,pass123,1h-200fcfa
 *
 * Format 3 (MikroTik User Manager export) :
 *   name,password,profile,...
 *   wifi_a3k9m2,pass123,1h,...
 *
 * Le parser est tolérant : il détecte automatiquement les colonnes
 * username/password même si les headers sont différents.
 */

export interface ParsedTicket {
  username: string;
  password: string;
  profile?: string;
}

export interface CSVParseResult {
  tickets: ParsedTicket[];
  errors: string[];
  totalRows: number;
  skippedRows: number;
}

/**
 * Parse un fichier CSV de tickets MikroTik.
 * Retourne les tickets valides et les erreurs rencontrées.
 */
export function parseTicketCSV(csvContent: string): CSVParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { tickets: [], errors: ['Fichier vide'], totalRows: 0, skippedRows: 0 };
  }

  const tickets: ParsedTicket[] = [];
  const errors: string[] = [];
  let skippedRows = 0;

  // Détecter si la première ligne est un header
  const firstLine = lines[0].toLowerCase();
  const hasHeader =
    firstLine.includes('username') ||
    firstLine.includes('password') ||
    firstLine.includes('name') ||
    firstLine.includes('profile');

  const startIndex = hasHeader ? 1 : 0;

  // Détecter les indices de colonnes
  let usernameIdx = 0;
  let passwordIdx = 1;
  let profileIdx = -1;

  if (hasHeader) {
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    usernameIdx = headers.findIndex(
      (h) => h === 'username' || h === 'name' || h === 'user'
    );
    passwordIdx = headers.findIndex(
      (h) => h === 'password' || h === 'pass' || h === 'pwd'
    );
    profileIdx = headers.findIndex(
      (h) => h === 'profile' || h === 'group' || h === 'plan'
    );

    if (usernameIdx === -1) usernameIdx = 0;
    if (passwordIdx === -1) passwordIdx = 1;
  }

  // Parser chaque ligne
  for (let i = startIndex; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    const lineNum = i + 1;

    if (columns.length < 2) {
      errors.push(`Ligne ${lineNum}: pas assez de colonnes (${columns.length})`);
      skippedRows++;
      continue;
    }

    const username = columns[usernameIdx]?.trim();
    const password = columns[passwordIdx]?.trim();
    const profile = profileIdx >= 0 ? columns[profileIdx]?.trim() : undefined;

    if (!username || username.length < 2) {
      errors.push(`Ligne ${lineNum}: username invalide ("${username}")`);
      skippedRows++;
      continue;
    }

    if (!password || password.length < 2) {
      errors.push(`Ligne ${lineNum}: password invalide`);
      skippedRows++;
      continue;
    }

    tickets.push({ username, password, profile });
  }

  return {
    tickets,
    errors,
    totalRows: lines.length - (hasHeader ? 1 : 0),
    skippedRows,
  };
}

/** Parse une ligne CSV en tenant compte des guillemets */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map((s) => s.replace(/^"|"$/g, '').trim());
}
