# 🚀 Guia de Deploy - Software de Vendas Livraria

Este documento descreve as melhores opções para fazer deploy do sistema, considerando que ele precisa se conectar a um banco SQL Server legado.

## 📊 Análise do Sistema

- **Framework**: Next.js 14 (App Router)
- **Runtime**: Node.js 18+
- **Banco de Dados**: SQL Server externo (legado)
- **Dependências**: mssql, React, Tailwind CSS
- **Porta**: Configurável (padrão 3000)

## 🎯 Opções de Deploy Recomendadas

### 1. **Vercel** ⭐ (Recomendado para Next.js)

**Vantagens:**
- ✅ Otimizado para Next.js
- ✅ Deploy automático via Git
- ✅ CDN global
- ✅ SSL automático
- ✅ Preview deployments
- ✅ Gratuito para projetos pessoais

**Desvantagens:**
- ⚠️ Precisa configurar variáveis de ambiente
- ⚠️ Timeout de 10s para funções serverless (pode ser ajustado)

**Passos:**

**Opção 1: Script automatizado (recomendado)**
```bash
./scripts/deploy-vercel.sh
```

**Opção 2: Manual**
1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Fazer login:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel
```

4. **Configurar variáveis de ambiente no dashboard Vercel:**
   - Acesse: https://vercel.com/seu-projeto/settings/environment-variables
   - Adicione:
     ```
     LEGACY_DB_HOST=51.222.51.77
     LEGACY_DB_PORT=7500
     LEGACY_DB_USER=mvv_livraria
     LEGACY_DB_PASSWORD=sua_senha
     LEGACY_DB_NAME=nome_do_banco
     LEGACY_DB_ENCRYPT=true
     ```

5. **Configurar `next.config.js` para produção:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Para SQL Server, pode precisar aumentar timeout
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
```

**⚠️ Importante para Vercel:**
- O SQL Server precisa estar acessível publicamente (ou usar VPN/tunnel)
- Considere usar **Vercel Pro** para aumentar timeouts se necessário
- Para conexões persistentes, considere usar Edge Functions

---

### 2. **Railway** ⭐⭐ (Recomendado para Node.js + SQL Server)

**Vantagens:**
- ✅ Excelente para Node.js
- ✅ Suporta conexões persistentes com SQL Server
- ✅ Variáveis de ambiente fáceis
- ✅ Deploy via Git
- ✅ Logs em tempo real
- ✅ SSL automático
- ✅ Plano gratuito generoso

**Desvantagens:**
- ⚠️ Pode ser mais caro que Vercel em escala

**Passos:**

1. **Criar conta em:** https://railway.app

2. **Conectar repositório GitHub**

3. **Configurar variáveis de ambiente:**
   - No dashboard Railway, vá em "Variables"
   - Adicione todas as variáveis `LEGACY_DB_*`

4. **Railway detecta automaticamente Next.js e faz build**

5. **Configurar `railway.json` (opcional):**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

### 3. **Render** ⭐ (Alternativa similar ao Railway)

**Vantagens:**
- ✅ Similar ao Railway
- ✅ Plano gratuito disponível
- ✅ Deploy automático via Git
- ✅ SSL automático

**Passos:**

1. **Criar conta em:** https://render.com

2. **Criar novo "Web Service"**

3. **Conectar repositório**

4. **Configurar:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

5. **Adicionar variáveis de ambiente no dashboard**

---

### 4. **VPS (DigitalOcean, AWS EC2, Linode)** ⭐⭐⭐ (Máximo controle)

**Vantagens:**
- ✅ Controle total
- ✅ Melhor para conexões persistentes com SQL Server
- ✅ Sem limitações de timeout
- ✅ Pode hospedar outros serviços

**Desvantagens:**
- ⚠️ Requer conhecimento de servidor
- ⚠️ Precisa configurar SSL manualmente
- ⚠️ Manutenção contínua

**Passos:**

1. **Criar servidor Ubuntu 22.04**

2. **Instalar Node.js 18+ e PM2:**
```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2
```

3. **Clonar e configurar projeto:**
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/software_vendas_livraria.git
cd software_vendas_livraria

# Instalar dependências
npm install

# Criar arquivo .env.local
nano .env.local
# Adicionar variáveis de ambiente
```

4. **Build e start com PM2:**
```bash
# Build
npm run build

# Iniciar com PM2
pm2 start npm --name "livraria-pdv" -- start
pm2 save
pm2 startup
```

5. **Configurar Nginx como reverse proxy:**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/livraria
```

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/livraria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Configurar SSL com Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

### 5. **Docker + Docker Compose** 🐳 (Portabilidade)

**Vantagens:**
- ✅ Portável entre ambientes
- ✅ Fácil de escalar
- ✅ Isolamento de dependências

**Criar `Dockerfile`:**
```dockerfile
FROM node:18-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild o código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Imagem de produção, copiar todos os arquivos e executar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Atualizar `next.config.js` para standalone:**
```javascript
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Para Docker
}
```

**Criar `docker-compose.yml`:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LEGACY_DB_HOST=${LEGACY_DB_HOST}
      - LEGACY_DB_PORT=${LEGACY_DB_PORT}
      - LEGACY_DB_USER=${LEGACY_DB_USER}
      - LEGACY_DB_PASSWORD=${LEGACY_DB_PASSWORD}
      - LEGACY_DB_NAME=${LEGACY_DB_NAME}
      - LEGACY_DB_ENCRYPT=${LEGACY_DB_ENCRYPT}
    restart: unless-stopped
```

**Deploy:**

**Opção 1: Script automatizado (recomendado)**
```bash
./scripts/deploy-docker.sh
```

**Opção 2: Manual**
```bash
export DOCKER_BUILD=true
docker-compose build
docker-compose up -d
```

---

## 🔒 Segurança e Boas Práticas

### 1. **Variáveis de Ambiente**
- ✅ **NUNCA** commitar `.env.local` no Git
- ✅ Usar variáveis de ambiente do provedor
- ✅ Rotacionar senhas regularmente

### 2. **Conexão SQL Server**
- ✅ Usar `LEGACY_DB_ENCRYPT=true` em produção
- ✅ Verificar se o SQL Server aceita conexões externas
- ✅ Configurar firewall para permitir apenas IPs do servidor de deploy
- ✅ Considerar usar VPN/tunnel se possível

### 3. **Monitoramento**
- ✅ Configurar logs estruturados
- ✅ Monitorar conexões de banco
- ✅ Alertas para erros críticos

### 4. **Backup**
- ✅ Fazer backup regular do banco legado
- ✅ Versionar código no Git

---

## 📝 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] `npm run build` funciona localmente
- [ ] Conexão com SQL Server testada
- [ ] `.env.local` está no `.gitignore`
- [ ] Testes básicos funcionando (`/api/health`)
- [ ] SSL configurado (se VPS)
- [ ] Domínio apontado corretamente
- [ ] Logs configurados para monitoramento

---

## 🎯 Recomendação Final

**Para começar rápido:**
1. **Vercel** - Melhor para MVP e testes
2. **Railway** - Se precisar de mais controle e conexões persistentes

**Para produção robusta:**
1. **VPS (DigitalOcean/AWS)** - Máximo controle e performance
2. **Docker** - Se precisar de portabilidade entre ambientes

**Para equipes pequenas:**
- **Railway** ou **Render** - Equilíbrio entre facilidade e controle

---

## 🆘 Troubleshooting

### Erro: "Cannot connect to SQL Server"
- Verificar se o SQL Server aceita conexões externas
- Verificar firewall do servidor SQL Server
- Testar conexão com `sqlcmd` ou ferramenta similar
- Verificar se a porta está aberta

### Erro: "Timeout"
- Aumentar timeout nas configurações do provedor
- Verificar latência de rede
- Considerar usar connection pooling

### Erro: "Build failed"
- Verificar logs de build
- Testar `npm run build` localmente
- Verificar versão do Node.js (precisa ser 18+)

---

## 📚 Recursos Adicionais

- [Documentação Next.js Deploy](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
