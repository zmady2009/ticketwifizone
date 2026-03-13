/**
 * Types métier de l'application TicketWiFiZone.
 * Les types de base de données sont dans database.ts (généré par Supabase CLI).
 */

import type { Operator } from '@/lib/ussd';

// === Entités métier ===

export interface Zone {
  id: string;
  owner_id: string;
  name: string;
  address?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Tarif {
  id: string;
  zone_id: string;
  label: string;
  duration_minutes: number;
  data_limit_mb?: number;
  price_fcfa: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  zone_id: string;
  tarif_id: string;
  username: string;
  password: string;
  status: 'available' | 'sold' | 'expired';
  buyer_phone?: string;
  sold_at?: string;
  created_at: string;
}

export interface PendingRequest {
  id: string;
  zone_id: string;
  tarif_id: string;
  client_phone: string;
  operator: Operator;
  amount_fcfa: number;
  status: 'waiting_payment' | 'completed' | 'expired' | 'manual_review';
  ticket_id?: string;
  sms_ref?: string;
  expires_at: string;
  created_at: string;
  completed_at?: string;
}

export interface Transaction {
  id: string;
  zone_id: string;
  tarif_id: string;
  ticket_id?: string;
  pending_request_id?: string;
  amount_fcfa: number;
  buyer_phone: string;
  operator: Operator;
  sms_ref?: string;
  validation_method: 'sms_forward' | 'manual' | 'api';
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  zone_id: string;
  operator: Operator;
  phone_number: string;
  ussd_format: string;
  is_active: boolean;
}

// === Vues composées (utilisées dans le dashboard) ===

export interface ZoneWithStats extends Zone {
  tarifs: Tarif[];
  ticketCounts: {
    tarifId: string;
    available: number;
    sold: number;
  }[];
  paymentMethods: PaymentMethod[];
  todaySales: number;
  todayRevenue: number;
}

export interface DailyStats {
  totalSales: number;
  totalRevenue: number;
  totalTicketsAvailable: number;
  totalZones: number;
}

// === Page d'achat client ===

export interface PurchasePageData {
  zone: Pick<Zone, 'id' | 'name' | 'address' | 'city'>;
  tarifs: Pick<Tarif, 'id' | 'label' | 'duration_minutes' | 'price_fcfa'>[];
  paymentMethods: Pick<PaymentMethod, 'operator' | 'phone_number' | 'ussd_format'>[];
}

export interface PurchaseResult {
  requestId: string;
  status: PendingRequest['status'];
  ticket?: {
    username: string;
    password: string;
  };
}
