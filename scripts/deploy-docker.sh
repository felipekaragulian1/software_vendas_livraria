#!/bin/bash
# Script de deploy com Docker

set -e

echo "🐳 Iniciando deploy com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ Arquivo .env.local não encontrado!"
    echo "Crie o arquivo .env.local com as variáveis de ambiente necessárias."
    exit 1
fi

# Build da imagem
echo "📦 Construindo imagem Docker..."
export DOCKER_BUILD=true
docker-compose build

# Iniciar containers
echo "🚀 Iniciando containers..."
docker-compose up -d

# Aguardar health check
echo "⏳ Aguardando aplicação iniciar..."
sleep 5

# Verificar health
echo "🏥 Verificando saúde da aplicação..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Aplicação está rodando em http://localhost:3000"
else
    echo "⚠️  Aplicação pode não estar pronta ainda. Verifique os logs:"
    echo "   docker-compose logs -f"
fi

echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker-compose logs -f"
echo "   Parar: docker-compose down"
echo "   Reiniciar: docker-compose restart"
