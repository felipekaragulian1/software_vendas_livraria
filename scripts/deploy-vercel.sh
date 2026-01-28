#!/bin/bash
# Script de deploy rápido para Vercel

set -e

echo "🚀 Iniciando deploy para Vercel..."

# Verificar se vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrado. Instalando..."
    npm install -g vercel
fi

# Verificar se está logado
if ! vercel whoami &> /dev/null; then
    echo "🔐 Fazendo login no Vercel..."
    vercel login
fi

# Build local para testar
echo "📦 Fazendo build local..."
npm run build

# Deploy
echo "🚀 Fazendo deploy..."
vercel --prod

echo "✅ Deploy concluído!"
echo ""
echo "⚠️  IMPORTANTE: Configure as variáveis de ambiente no dashboard Vercel:"
echo "   - LEGACY_DB_HOST"
echo "   - LEGACY_DB_PORT"
echo "   - LEGACY_DB_USER"
echo "   - LEGACY_DB_PASSWORD"
echo "   - LEGACY_DB_NAME"
echo "   - LEGACY_DB_ENCRYPT"
echo ""
echo "Acesse: https://vercel.com/seu-projeto/settings/environment-variables"
