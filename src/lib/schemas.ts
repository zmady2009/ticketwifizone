/**
 * Schémas de validation Zod pour toutes les entrées utilisateur.
 * Chaque API route doit valider ses inputs avec ces schémas.
 */

import { z } from 'zod';

// === Numéro de téléphone Burkina (8 chiffres) ===
const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{8}$/, 'Numéro à 8 chiffres requis'));

const operatorSchema = z.enum(['orange', 'moov', 'telecel', 'wave']);

// === Achat : création de pending_request ===
export const purchaseInitiateSchema = z.object({
  zoneId: z.string().uuid('ID de zone invalide'),
  tarifId: z.string().uuid('ID de tarif invalide'),
  clientPhone: phoneSchema,
  operator: operatorSchema,
});

// === Achat : vérification du statut ===
export const purchaseCheckSchema = z.object({
  requestId: z.string().uuid('ID de demande invalide'),
});

// === SMS Webhook ===
export const smsWebhookSchema = z.object({
  from: z.string().min(1, 'Expéditeur requis'),
  body: z.string().min(10, 'Corps du SMS trop court'),
  receivedAt: z.string().datetime().optional(),
  token: z.string().min(32, 'Token invalide'),
});

// === Validation manuelle ===
export const manualValidateSchema = z.object({
  requestId: z.string().uuid('ID de demande invalide'),
  action: z.enum(['approve', 'reject']),
});

// === Création de zone ===
export const createZoneSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  address: z.string().max(200).optional(),
  city: z.string().max(100).default('Ouagadougou'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// === Création de tarif ===
export const createTarifSchema = z.object({
  zoneId: z.string().uuid(),
  label: z.string().min(1, 'Libellé requis').max(50),
  durationMinutes: z.number().int().positive('Durée invalide'),
  dataLimitMb: z.number().int().positive().optional(),
  priceFcfa: z.number().int().min(50, 'Prix minimum 50 FCFA').max(100000),
  sortOrder: z.number().int().default(0),
});

// === Configuration méthode de paiement ===
export const paymentMethodSchema = z.object({
  zoneId: z.string().uuid(),
  operator: operatorSchema,
  phoneNumber: phoneSchema,
  ussdFormat: z.string().min(5, 'Format USSD invalide'),
  isActive: z.boolean().default(true),
});

// === Upload tickets (chaque ligne du CSV) ===
export const ticketRowSchema = z.object({
  username: z.string().min(2, 'Username trop court').max(50),
  password: z.string().min(2, 'Password trop court').max(50),
});

// === Upload batch de tickets ===
export const ticketUploadSchema = z.object({
  zoneId: z.string().uuid(),
  tarifId: z.string().uuid(),
  tickets: z.array(ticketRowSchema).min(1, 'Au moins 1 ticket requis'),
});

// === Types inférés ===
export type PurchaseInitiateInput = z.infer<typeof purchaseInitiateSchema>;
export type PurchaseCheckInput = z.infer<typeof purchaseCheckSchema>;
export type SMSWebhookInput = z.infer<typeof smsWebhookSchema>;
export type ManualValidateInput = z.infer<typeof manualValidateSchema>;
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type CreateTarifInput = z.infer<typeof createTarifSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type TicketUploadInput = z.infer<typeof ticketUploadSchema>;
