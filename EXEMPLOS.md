# 🔧 Exemplos de Uso - Sistema de Gestão de Ferramentas YKK

Este documento contém exemplos práticos de como usar todas as funcionalidades do sistema.

## 🚀 1. Primeiro Acesso

### Fazer Login
1. Abra o navegador em: `http://localhost:3001`
2. Use as credenciais:
   - **Email**: `admin@ykk.com`
   - **Senha**: `admin123`
3. Clique em "Entrar" ou use o botão "Preencher Automaticamente"

---

## 📊 2. Navegando no Dashboard

### Visualizar KPIs
- **Produção do Mês**: Total de peças produzidas no mês atual
- **Ferramentas em Alerta**: Quantidade de ferramentas que precisam de atenção
- **Trocas no Mês**: Número de trocas realizadas no mês

### Analisar Gráficos
- **Gráfico de Pizza**: Status atual de todas as ferramentas (OK, Atenção, Trocar)
- **Top 5 Produção**: Os 5 moldes com maior produção acumulada
- **Refugo por Molde**: Quantidade de peças rejeitadas por molde
- **Trocas por Mês**: Evolução temporal das trocas

---

## 🛠️ 3. Gerenciando Ferramentas

### Adicionar Nova Ferramenta
```
Exemplo:
- ID do Molde: MOLDE-F
- ID da Ferramenta: FER-F1
- Vida Útil: 80000
- Observações: Ferramenta para produção especial
```

### Registrar Produção Diária
1. Localize o molde na lista
2. Digite a quantidade no campo "Prod. Diária"
   - Exemplo: `5000` peças
3. Clique no botão verde ✅

### Trocar Ferramenta
1. Identifique ferramenta com status "🔴 Trocar Ferramenta (TF)"
2. Clique no ícone 🔄 "Trocar Ferramenta"
3. Confirme a ação
4. A produção será zerada automaticamente

---

## 📝 4. Sistema de Comentários

### Adicionar Comentário ao Molde
1. Na linha do molde, clique no ícone 💬+
2. Digite o comentário:
   ```
   Exemplo: "Ajuste de pressão realizado às 14h. Verificar qualidade nas próximas 1000 peças."
   ```
3. Clique em "Salvar Comentário"

### Visualizar Comentários
1. Clique no ícone 💬 "Ver Comentários"
2. Visualize o histórico organizado por data

---

## 📊 5. Registro de Refugo

### Registrar Refugo Mensal
1. No Dashboard, clique em "Registrar Refugo Mensal"
2. Preencha os dados:
   ```
   Exemplo:
   - Mês/Ano: 08/2025
   - ID do Molde: MOLDE-A
   - Quantidade: 250
   ```
3. Clique em "Salvar Refugo"

---

## 📈 6. Análise e Relatórios

### Visualizar Histórico de Produção
1. Clique no ícone 📊 ao lado da ferramenta
2. Analise a tabela com datas e quantidades produzidas

### Verificar Histórico de Trocas
1. No Dashboard, clique em "Histórico de Trocas"
2. Visualize todas as trocas realizadas com:
   - Data e hora da troca
   - Molde e ferramenta trocada
   - Produção acumulada antes da troca

---

## 🎯 7. Cenários de Uso Práticos

### Cenário 1: Monitoramento Preventivo
```
Situação: Ferramenta com 75% da vida útil consumida
Status: 🟡 Atenção!
Ação: Planejar troca para próxima parada de manutenção
```

### Cenário 2: Troca Urgente
```
Situação: Ferramenta com 85% da vida útil consumida
Status: 🔴 Trocar Ferramenta (TF)
Ação: Parar produção e trocar imediatamente
```

### Cenário 3: Análise de Refugo
```
Situação: Alto refugo no MOLDE-B
Ação: 
1. Verificar comentários do molde
2. Analisar histórico de produção
3. Registrar ações corretivas nos comentários
```

---

## 🔧 8. APIs para Integração

### Testando APIs Manualmente

#### Verificar Status do Sistema
```bash
curl http://localhost:3001/api/health
```

#### Obter Token de Autenticação
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ykk.com","password":"admin123"}'
```

#### Listar Ferramentas (com token)
```bash
curl -X GET http://localhost:3001/api/tools \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 📱 9. Funcionalidades Mobile

O sistema é responsivo e funciona bem em dispositivos móveis:

- **Navegação**: Use os dedos para navegar pelas abas
- **Gráficos**: São redimensionados automaticamente
- **Formulários**: Teclado virtual otimizado para números
- **Tabelas**: Rolagem horizontal automática

---

## 🚨 10. Alertas e Notificações

### Interpretando Cores
- 🟢 **Verde (OK)**: Ferramenta em bom estado (< 70% da vida útil)
- 🟡 **Amarelo (Atenção)**: Próximo da troca (70-80% da vida útil)
- 🔴 **Vermelho (Trocar)**: Troca necessária (> 80% da vida útil)

### Barras de Progresso
- **Barra Verde**: Vida útil restante > 30%
- **Barra Amarela**: Vida útil restante entre 20-30%
- **Barra Vermelha**: Vida útil restante < 20%

---

## 💾 11. Backup e Dados

### Localização dos Dados
```
Arquivo: server/database/gestao_ykk.db
Formato: SQLite (portável)
```

### Backup Manual
1. Pare o servidor: `Ctrl+C`
2. Copie o arquivo `gestao_ykk.db`
3. Reinicie: `npm start`

### Restaurar Dados Iniciais
```bash
npm run init-db
```
⚠️ **Atenção**: Isso apagará todos os dados existentes!

---

## 🎓 12. Dicas Avançadas

### Otimização de Performance
- Registre produção em lotes maiores quando possível
- Limpe comentários antigos periodicamente
- Use filtros nos gráficos para análises específicas

### Melhores Práticas
1. **Registre produção diariamente** para manter dados atualizados
2. **Adicione comentários** em situações anômalas
3. **Monitore o dashboard** regularmente para ações preventivas
4. **Documente trocas** com observações detalhadas

### Personalização
- **Thresholds**: Modifique os limites de alerta no código
- **Gráficos**: Adicione novos tipos de visualização
- **KPIs**: Inclua métricas específicas da sua operação

---

## 📞 Suporte e Troubleshooting

### Problemas Comuns

#### "Erro ao carregar dados"
**Solução**: Verifique se o servidor está rodando em `http://localhost:3001`

#### "Token inválido"
**Solução**: Faça logout e login novamente

#### "Ferramenta não encontrada"
**Solução**: Verifique se a ferramenta não foi excluída por outro usuário

### Logs do Sistema
```bash
# No terminal onde o servidor está rodando
# Os logs aparecem em tempo real
```

### Reset Completo
```bash
# Parar servidor
Ctrl+C

# Reinstalar e reinicializar
npm run install-all
npm run init-db
npm run build-frontend
npm start
```

---

**Versão do Documento**: 1.0.0  
**Compatível com**: Sistema de Gestão YKK v1.0.0  
**Última Atualização**: Agosto 2025
