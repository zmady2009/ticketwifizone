-- ============================================================
-- Migration 002: Add public read policy for zones table
-- ============================================================
--
-- Problème: La page d'achat publique /zone/[zoneId]/buy renvoie 404
-- pour les utilisateurs non connectés car la table 'zones' n'a pas
-- de politique de lecture publique.
--
-- Solution: Ajouter une politique RLS pour autoriser la lecture
-- publique des zones actives, suivant le même pattern que tarifs
-- et zone_payment_methods.
--
-- Sécurité: Cette politique ne permet que la lecture (SELECT),
-- pas de modification. Seules les zones actives (is_active = true)
-- sont visibles publiquement.

-- Créer la politique de lecture publique pour les zones actives
CREATE POLICY "zones_public_read" ON zones
  FOR SELECT
  TO public
  USING (is_active = true);

-- Commentaire de documentation
COMMENT ON POLICY "zones_public_read" ON zones IS
  'Autorise la lecture publique des zones actives pour la page d''achat client';
