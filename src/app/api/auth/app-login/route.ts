/**
 * POST /api/auth/app-login
 *
 * Endpoint d'authentification pour l'application Android SMS Forwarder.
 *
 * Permet au propriétaire de se connecter avec email + mot de passe
 * et récupérer son token d'authentification ainsi que son webhook token.
 *
 * FLOW:
 * 1. Valider email/password
 * 2. Authentifier via Supabase Auth
 * 3. Récupérer profil, zones actives, et webhook token
 * 4. Créer un webhook token s'il n'existe pas
 * 5. Retourner les données à l'app Android
 *
 * SÉCURITÉ:
 * - Rate limiting en mémoire (10 tentatives/heure par email)
 * - Validation Zod des entrées
 * - CORS pour app Android
 * - Utilise le service role pour les requêtes DB (pas d'auth utilisateur)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

/**
 * Schéma de validation pour la connexion app
 */
const appLoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

/**
 * Headers CORS pour l'app Android
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Crée une réponse JSON avec headers CORS
 */
function corsResponse(data: any, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: CORS_HEADERS,
  });
}

/**
 * Rate limiting en mémoire
 * Map: email -> { count, resetAt }
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 heure en ms

/**
 * Vérifie le rate limiting pour un email
 * @returns true si autorisé, false si rate limité
 */
function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(email);

  // Nettoyer les enregistrements expirés
  if (record && now > record.resetAt) {
    rateLimitMap.delete(email);
    return true;
  }

  // Si pas d'enregistrement, créer un nouveau
  if (!record) {
    rateLimitMap.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  // Vérifier si limite dépassée
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  // Incrémenter le compteur
  record.count++;
  return true;
}

/**
 * Génère un token webhook sécurisé (64 caractères hexadécimaux)
 */
function generateWebhookToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/app-login
 *
 * Body: { email: string, password: string }
 *
 * Success (200): {
 *   token: string,           // access_token Supabase
 *   user: {
 *     id: string,
 *     email: string,
 *     businessName: string
 *   },
 *   zones: Array<{
 *     id: string,
 *     name: string,
 *     webhookToken: string   // Même token pour toutes les zones
 *   }>
 * }
 *
 * Errors:
 * - 400: Email ou mot de passe invalide
 * - 401: Authentification échouée
 * - 429: Trop de tentatives
 * - 500: Erreur serveur
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parser et valider le corps de la requête
    const rawBody = await request.json();
    const validationResult = appLoginSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return corsResponse({ error: 'Email et mot de passe requis' }, 400);
    }

    const { email, password } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Vérifier le rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      return corsResponse({ error: 'Trop de tentatives. Réessayez dans 10 minutes.' }, 429);
    }

    // 3. Authentifier avec Supabase Auth
    // Pour signInWithPassword, on utilise createClient directement depuis @supabase/supabase-js
    // car le createClient SSR (@/lib/supabase/server) est fait pour lire les cookies existants
    const authClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    // Utiliser le client admin pour les opérations DB (bypass RLS)
    const supabase = createAdminClient();

    if (signInError || !signInData.user) {
      console.error('Auth error:', signInError);
      return corsResponse({ error: 'Email ou mot de passe incorrect' }, 401);
    }

    const user = signInData.user;
    const accessToken = signInData.session?.access_token;

    if (!accessToken) {
      return corsResponse({ error: 'Erreur lors de la création de la session' }, 500);
    }

    // 4. Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, phone, business_name, city')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      // On continue même si le profil n'existe pas (cas edge)
    }

    // 5. Récupérer les zones actives du propriétaire
    const { data: zones, error: zonesError } = await supabase
      .from('zones')
      .select('id, name, is_active')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (zonesError) {
      console.error('Zones error:', zonesError);
    }

    // 6. Récupérer ou créer le webhook token
    let webhookToken = '';

    const { data: existingToken, error: tokenError } = await supabase
      .from('sms_webhook_tokens')
      .select('id, token')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (existingToken) {
      webhookToken = existingToken.token;
    } else {
      // Créer un nouveau webhook token
      const newToken = generateWebhookToken();

      const { data: createdToken, error: createError } = await supabase
        .from('sms_webhook_tokens')
        .insert({
          owner_id: user.id,
          token: newToken,
          is_active: true,
        })
        .select('token')
        .single();

      if (createError) {
        console.error('Token creation error:', createError);
        return corsResponse({ error: 'Erreur lors de la création du token webhook' }, 500);
      }

      webhookToken = createdToken.token;
    }

    // 7. Construire la réponse
    const zonesWithToken = (zones || []).map((zone) => ({
      id: zone.id,
      name: zone.name,
      webhookToken, // Même token pour toutes les zones
    }));

    return corsResponse({
      token: accessToken,
      user: {
        id: user.id,
        email: profile?.email || user.email,
        businessName: profile?.business_name || null,
      },
      zones: zonesWithToken,
    });

  } catch (error: any) {
    console.error('Unexpected error in app-login:', error);
    return corsResponse({ error: 'Erreur serveur' }, 500);
  }
}

/**
 * OPTIONS handler pour CORS (preflight depuis l'app Android)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400', // 24 heures
    },
  });
}
