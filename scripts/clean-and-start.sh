#!/bin/bash
# Script pour nettoyer et redémarrer le serveur de développement proprement

echo "🧹 Arrêt des processus Node existants..."
taskkill //F //IM node.exe 2>/dev/null || true

echo "🗑️  Suppression du cache .next..."
rm -rf .next

echo "🚀 Démarrage du serveur de développement..."
npm run dev -- --port 3004
