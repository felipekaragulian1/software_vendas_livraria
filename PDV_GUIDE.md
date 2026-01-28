# Guia Rápido - PDV (Ponto de Venda)

## 🚀 Início Rápido

1. Acesse a página inicial (`/`)
2. Clique em **"Nova Venda"** ou acesse `/checkout`
3. O campo de busca já estará focado e pronto para uso

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `F2` | Foca o campo de busca (útil se você clicou em outro lugar) |
| `Enter` | Adiciona o primeiro produto da lista ao carrinho |
| `↑` | Navega para cima na lista de resultados da busca |
| `↓` | Navega para baixo na lista de resultados da busca |
| `Esc` | Limpa a busca e fecha a lista de resultados |

## 📝 Fluxo de Venda

### 1. Buscar Produto
- Digite o **nome** ou **ID** do produto no campo de busca
- A busca é automática (aguarda 200ms após parar de digitar)
- Use as **setas ↑ ↓** para navegar na lista
- Pressione **Enter** ou clique para adicionar

### 2. Gerenciar Carrinho
- **Botão +** - Aumenta a quantidade
- **Botão −** - Diminui a quantidade
- **×** - Remove o item do carrinho
- Se a quantidade for maior que o estoque, aparecerá um aviso amarelo

### 3. Selecionar Pagamento
- Clique em uma das formas: **PIX**, **CARTÃO** ou **DINHEIRO**
- A forma selecionada ficará destacada em azul

### 4. Finalizar Venda
- Clique no botão **"FINALIZAR VENDA"** (verde, grande)
- Aguarde o processamento (botão mostrará "Finalizando...")
- Visualize o resumo da venda concluída
- Clique em **"Nova Venda"** para começar outra

## ⚠️ Avisos e Erros

### Estoque Insuficiente
- Se você adicionar mais itens do que há em estoque, verá um aviso amarelo no carrinho
- O backend validará novamente na finalização
- Se realmente não houver estoque, a venda será cancelada e você verá um erro vermelho

### Erros de Conexão
- Se houver problema de conexão, um toast vermelho aparecerá
- O carrinho será mantido para você tentar novamente

### Sucesso
- Após finalizar com sucesso, um toast verde aparecerá
- A tela de confirmação mostrará o resumo completo

## 💡 Dicas

1. **Foco Automático**: Após adicionar um produto, o foco volta automaticamente ao campo de busca
2. **Busca Rápida**: Digite apenas parte do nome - a busca é por LIKE
3. **Busca por ID**: Se digitar apenas números, buscará pelo ID exato
4. **Quantidade**: Se o produto já estiver no carrinho, adicionar novamente incrementa a quantidade
5. **Mobile**: No celular, o botão "FINALIZAR VENDA" fica fixo no rodapé para fácil acesso

## 📊 Relatórios

Acesse `/reports` para ver:
- Total vendido no período
- Número de vendas
- Ticket médio
- Top produtos por quantidade e faturamento
- Exportação em CSV
