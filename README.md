# Software de Vendas - Livraria

Sistema de vendas integrado com banco de dados legado SQL Server.

## 🚀 Tecnologias

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **mssql** (driver SQL Server)

## 📋 Pré-requisitos

- Node.js 18+
- Acesso ao banco de dados legado SQL Server

## ⚙️ Configuração

1. Instale as dependências:
```bash
npm install
```

2. Copie o arquivo de exemplo de variáveis de ambiente:
```bash
cp env.example .env.local
```

3. Configure as variáveis de ambiente no `.env.local`:
```env
LEGACY_DB_HOST=51.222.51.77
LEGACY_DB_PORT=7500
LEGACY_DB_USER=belinda
LEGACY_DB_PASSWORD=sua_senha_aqui
LEGACY_DB_NAME=Belinda
LEGACY_DB_ENCRYPT=true
```

**⚠️ IMPORTANTE - Formato da Conexão:**
- **NÃO** coloque vírgula ou porta no `LEGACY_DB_HOST`
  - ❌ ERRADO: `LEGACY_DB_HOST=51.222.51.77,7500`
  - ✅ CORRETO: `LEGACY_DB_HOST=51.222.51.77` e `LEGACY_DB_PORT=7500`
- O sistema usa `trustServerCertificate=true` automaticamente (equivalente ao .NET)
- `LEGACY_DB_ENCRYPT=true` é recomendado (padrão se não especificado)
- Todas as variáveis são **obrigatórias** - o sistema valida na inicialização

**Equivalência com Connection String .NET:**
```
.NET: Data source=51.222.51.77,7500;initial catalog=Belinda;user id=belinda;password=xxx;TrustServerCertificate=true;

Node.js (.env.local):
LEGACY_DB_HOST=51.222.51.77
LEGACY_DB_PORT=7500
LEGACY_DB_NAME=Belinda
LEGACY_DB_USER=belinda
LEGACY_DB_PASSWORD=xxx
LEGACY_DB_ENCRYPT=true
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Legadas

#### Produtos
```sql
CREATE TABLE Produtos (
    Id INT IDENTITY PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Preco DECIMAL(10,2) NOT NULL,
    Estoque INT NOT NULL
);
```

#### Pedidos
A estrutura da tabela `Pedidos` é descoberta automaticamente via `INFORMATION_SCHEMA`. O sistema assume:
- `Id` (IDENTITY PRIMARY KEY)
- `DataHora` ou coluna similar (datetime)
- `Total` ou coluna similar (decimal)
- `FormaPagamento` ou coluna similar (nvarchar) - opcional

#### PedidoItens
```sql
CREATE TABLE PedidoItens (
    Id INT IDENTITY PRIMARY KEY,
    PedidoId INT,
    ProdutoId INT,
    Quantidade INT,
    PrecoUnitario DECIMAL(10,2),
    FormaPagamento NVARCHAR(20), -- Pode não existir
    FOREIGN KEY (PedidoId) REFERENCES Pedidos(Id),
    FOREIGN KEY (ProdutoId) REFERENCES Produtos(Id)
);
```

**Observação sobre FormaPagamento em PedidoItens:**
- O sistema verifica automaticamente se a coluna `FormaPagamento` existe em `PedidoItens`
- Se não existir, a forma de pagamento será armazenada apenas em `Pedidos` (se a coluna existir lá)
- Se existir em ambos, será inserida em ambos os lugares

## 📡 Endpoints da API

### GET `/api/health`
Testa a conexão com o banco de dados e retorna informações do SQL Server.

**Resposta de Sucesso:**
```json
{
  "ok": true,
  "target": "51.222.51.77:7500",
  "database": "Belinda",
  "serverVersion": "Microsoft SQL Server ...",
  "timestamp": "2026-01-27T..."
}
```

**Resposta de Erro:**
```json
{
  "ok": false,
  "target": "51.222.51.77:7500",
  "database": "Belinda",
  "error": {
    "type": "CONNECTION_REFUSED",
    "message": "Conexão recusada ou timeout em 51.222.51.77:7500",
    "hint": "Porta bloqueada ou SQL Server não exposto. Teste: nc -vz 51.222.51.77 7500..."
  },
  "timestamp": "2026-01-27T..."
}
```

**Logs no Terminal:**
- Em caso de erro, o terminal exibe logs formatados com:
  - Destino (host:port)
  - Database
  - Tipo de erro
  - Mensagem clara
  - Sugestão de correção
  - Stack trace resumido (1-3 linhas)

### GET `/api/products?query=`
Busca produtos por nome ou ID.

**Parâmetros:**
- `query` (opcional): Nome do produto (LIKE) ou ID numérico (busca exata)

**Resposta:**
```json
{
  "products": [
    {
      "id": 1,
      "nome": "Livro Exemplo",
      "preco": 29.90,
      "estoque": 10
    }
  ]
}
```

### POST `/api/sales`
Cria uma nova venda com controle de estoque e transação.

**Payload:**
```json
{
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    }
  ],
  "formaPagamento": "PIX"
}
```

**Formas de pagamento válidas:** `PIX`, `CARTAO`, `DINHEIRO`

**Processo:**
1. Valida quantidades > 0
2. Busca preços atuais do banco (evita preço desatualizado)
3. Valida estoque disponível
4. Executa em **transação**:
   - Cria registro em `Pedidos`
   - Insere itens em `PedidoItens`
   - Atualiza estoque em `Produtos` (com validação: `WHERE Estoque >= Quantidade`)
5. Commit em sucesso; rollback em erro

**Resposta:**
```json
{
  "pedidoId": 123,
  "total": 59.80,
  "formaPagamento": "PIX",
  "itens": [
    {
      "produtoId": 1,
      "nome": "Livro Exemplo",
      "quantidade": 2,
      "precoUnitario": 29.90,
      "subtotal": 59.80
    }
  ]
}
```

### GET `/api/reports?from=YYYY-MM-DD&to=YYYY-MM-DD`
Gera relatórios agregados de vendas.

**Parâmetros:**
- `from` (opcional): Data inicial (YYYY-MM-DD)
- `to` (opcional): Data final (YYYY-MM-DD)

**Resposta:**
```json
{
  "periodo": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  },
  "totalVendidoPorDia": [
    {
      "data": "2026-01-15",
      "totalVendido": 1500.00,
      "numPedidos": 25
    }
  ],
  "totalPorFormaPagamento": [
    {
      "formaPagamento": "PIX",
      "total": 800.00
    }
  ],
  "topProdutosQuantidade": [
    {
      "id": 1,
      "nome": "Livro Exemplo",
      "totalQuantidade": 50,
      "totalFaturamento": 1495.00
    }
  ],
  "topProdutosFaturamento": [...]
}
```

## 🛠️ Desenvolvimento

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 🔍 Descoberta Automática de Schema

O sistema descobre automaticamente a estrutura das tabelas `Pedidos` e `PedidoItens` usando `INFORMATION_SCHEMA`, permitindo flexibilidade com diferentes estruturas de banco legado.

## ⚠️ Tratamento de Erros

### Erros de Conexão
O sistema possui logs formatados e amigáveis para diagnóstico:

- **DNS/Host inválido:** Detecta quando o host não é encontrado
- **Conexão recusada:** Identifica problemas de porta/firewall
- **Login failed:** Detecta credenciais inválidas
- **TLS/Certificate:** Identifica problemas de certificado
- **Database não encontrado:** Detecta database inexistente

**Rate Limiting de Logs:**
- Logs de erro são limitados a 1x a cada 5 segundos para evitar spam
- Útil quando múltiplas requisições falham simultaneamente

**Exemplo de Log no Terminal:**
```
============================================================
❌ ERRO DE CONEXÃO SQL SERVER
Contexto: getDbPool
────────────────────────────────────────────────────────────
Destino:     51.222.51.77:7500
Database:    Belinda
Driver:      mssql/tedious
Tipo:        CONNECTION_REFUSED
Mensagem:    Conexão recusada ou timeout em 51.222.51.77:7500
Código:      ECONNREFUSED

💡 Sugestão:
   Porta bloqueada ou SQL Server não exposto. Teste: nc -vz 51.222.51.77 7500...

📍 Stack (resumido):
   at Connection.connect (...)
   at getDbPool (...)
============================================================
```

### Erros de Negócio
- **Estoque insuficiente:** Validação com `WHERE Estoque >= Quantidade` previne race conditions
- **Transações:** Todas as vendas são executadas em transações (commit/rollback)

## 🖥️ Frontend - PDV (Ponto de Venda)

O sistema inclui um frontend completo e moderno para operação rápida de vendas.

### Páginas

#### `/` - Home
Menu principal com botões grandes para:
- **Nova Venda** - Acessa o PDV
- **Relatórios** - Visualiza relatórios de vendas

#### `/checkout` - PDV Principal
Interface otimizada para venda rápida com:

**Funcionalidades:**
- 🔍 **Busca de produtos** com autofocus e suporte a teclado
- 🛒 **Carrinho** com ajuste de quantidades
- 💳 **Seleção de forma de pagamento** (PIX, CARTÃO, DINHEIRO)
- ✅ **Finalização de venda** com feedback visual
- 📱 **Layout responsivo** para tablet e celular

**Atalhos de Teclado:**
- `F2` - Foca o campo de busca
- `Enter` - Adiciona o primeiro produto da lista (ou o selecionado)
- `↑` / `↓` - Navega na lista de resultados da busca
- `Esc` - Limpa a busca e fecha a lista de resultados
- Após adicionar item, o foco volta automaticamente ao campo de busca

**Fluxo de Venda:**
1. Digite o nome ou ID do produto no campo de busca
2. Use as setas para navegar e Enter para adicionar (ou clique)
3. Ajuste quantidades no carrinho com os botões + / −
4. Selecione a forma de pagamento
5. Clique em "FINALIZAR VENDA"
6. Visualize o resumo da venda concluída
7. Clique em "Nova Venda" para começar outra

**Recursos:**
- Busca com debounce (200ms) para otimizar requisições
- Validação de estoque (aviso se quantidade > estoque disponível)
- Toasts para feedback (sucesso, erro, avisos)
- Estado de loading durante finalização
- Tela de confirmação com resumo da venda

#### `/reports` - Relatórios
Painel de relatórios com:

**Filtros Rápidos:**
- Hoje
- Ontem
- 7 Dias
- Personalizado (selecionar datas)

**Métricas:**
- Total vendido no período
- Número de vendas
- Ticket médio

**Tabelas:**
- Top produtos por quantidade
- Top produtos por faturamento
- Total por forma de pagamento

**Exportação:**
- Botão "Exportar CSV" para download dos dados

### Componentes

- `SearchBox` - Campo de busca com sugestões e navegação por teclado
- `Cart` - Carrinho de compras com ajuste de quantidades
- `PaymentSelector` - Seletor de forma de pagamento
- `CheckoutSummary` - Resumo e botão de finalização
- `Toast` - Notificações de feedback

## ⌨️ Atalhos de Teclado (PDV)

| Tecla | Ação |
|-------|------|
| `F2` | Foca o campo de busca |
| `Enter` | Adiciona produto ao carrinho (primeiro da lista ou selecionado) |
| `↑` | Navega para cima na lista de resultados |
| `↓` | Navega para baixo na lista de resultados |
| `Esc` | Limpa a busca e fecha a lista |

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- **Desktop** - Layout em 3 colunas (busca/carrinho, carrinho, sidebar)
- **Tablet** - Layout adaptado com carrinho abaixo da busca
- **Mobile** - Layout vertical com botão "FINALIZAR VENDA" fixo no rodapé

## 📝 Notas

- O sistema não usa Prisma para o banco legado (usa `mssql` diretamente)
- Pool de conexões é reutilizado entre requisições
- Estrutura de `Pedidos` é descoberta na primeira requisição que precisa dela
- Frontend usa React hooks e fetch API
- Toasts são gerenciados localmente (sem biblioteca externa)
- Busca de produtos usa debounce para otimizar requisições
