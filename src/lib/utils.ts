import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes intelligemment (shadcn/ui pattern) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant en FCFA lisible : 1500 → "1 500 FCFA" */
export function formatCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

/** Formate un montant court : 1500 → "1 500 F" */
export function formatCFAShort(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' F';
}

/** Formate une durée en minutes en texte lisible : 60 → "1 heure", 1440 → "1 jour" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return '1 heure';
  if (minutes < 1440) return `${Math.round(minutes / 60)} heures`;
  if (minutes === 1440) return '1 jour';
  if (minutes < 10080) return `${Math.round(minutes / 1440)} jours`;
  if (minutes === 10080) return '1 semaine';
  return `${Math.round(minutes / 10080)} semaines`;
}

/** Date relative en français : "il y a 5 min", "aujourd'hui à 14:30" */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffMin < 1440) {
    return `aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffMin < 2880) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Génère une couleur d'icône pour un opérateur */
export function operatorColor(operator: string): string {
  const colors: Record<string, string> = {
    orange: 'text-orange-600 bg-orange-100',
    moov: 'text-blue-600 bg-blue-100',
    telecel: 'text-green-600 bg-green-100',
    wave: 'text-cyan-600 bg-cyan-100',
  };
  return colors[operator] || 'text-gray-600 bg-gray-100';
}
