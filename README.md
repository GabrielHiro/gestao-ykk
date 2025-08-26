# 🔧 Sistema de Gestão de Ferramentas YKK - Versão Piloto

## 📋 Descrição

Sistema piloto completo para gestão e monitoramento preditivo de ferramentas, desenvolvido com **Node.js/Express** no backend, **SQLite** como banco de dados e **React** no frontend. O sistema permite login de usuário, visualização de dashboards interativos com gráficos, CRUD completo de ferramentas e análise de dados em tempo real.

## ✨ Funcionalidades Principais

### 🔐 Autenticação
- Sistema de login seguro com JWT
- Proteção de rotas e APIs
- Sessões persistentes

### 📊 Dashboard Interativo
- **KPIs em tempo real**: Produção mensal, ferramentas em alerta, trocas no mês
- **Gráficos dinâmicos** com Recharts:
  - Gráfico de pizza: Status das ferramentas
  - Gráfico de barras: Top 5 produção por molde
  - Gráfico de barras: Refugo por molde
  - Gráfico de linha: Evolução de trocas mensais
- **Análise detalhada** de histórico de trocas

### 🛠️ Gestão de Ferramentas
- **CRUD completo**: Criar, visualizar, editar e excluir ferramentas
- **Monitoramento preditivo**: Status automático baseado em vida útil
- **Registro de produção**: Atualização diária por molde
- **Histórico detalhado**: Rastreamento completo de produção
- **Sistema de trocas**: Zeragem automática após troca

### 📝 Recursos Adicionais
- **Comentários por molde**: Sistema de anotações e observações
- **Registro de refugo**: Controle mensal de peças rejeitadas
- **Histórico de trocas**: Rastreamento completo de substituições
- **Alertas visuais**: Indicadores de status por cores

## 🚀 Instalação e Configuração

### 📋 Pré-requisitos
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

### 🔧 Passo a Passo

1. **Clone ou baixe o projeto**
   ```bash
   cd gestao-ykk
   ```

2. **Instalar todas as dependências**
   ```bash
   npm run install-all
   ```
   > Este comando instala dependências do backend e frontend automaticamente

3. **Inicializar o banco de dados**
   ```bash
   npm run init-db
   ```
   > Cria o banco SQLite e insere dados iniciais de demonstração

4. **Compilar o frontend**
   ```bash
   npm run build-frontend
   ```

5. **Iniciar o servidor**
   ```bash
   npm start
   ```
   > O sistema estará disponível em: http://localhost:3001

## 🎯 Acesso ao Sistema

### 🔑 Credenciais de Demonstração
- **Email**: `admin@ykk.com`
- **Senha**: `admin123`

### 🌐 URLs Disponíveis
- **Aplicação**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **Documentação da API**: Rotas disponíveis em `/api`

## 🏗️ Arquitetura do Sistema

### 📁 Estrutura do Projeto
```
gestao-ykk/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── Login.js     # Tela de login
│   │   │   ├── Dashboard.js # Dashboard principal
│   │   │   └── Charts.js    # Componente de gráficos
│   │   ├── services/
│   │   │   └── api.js       # Serviços de API
│   │   ├── App.js           # Componente principal
│   │   └── index.js         # Ponto de entrada
│   ├── public/
│   └── package.json
├── server/                   # Node.js Backend
│   ├── routes/              # Rotas da API
│   │   ├── auth.js          # Autenticação
│   │   ├── tools.js         # Ferramentas
│   │   └── dashboard.js     # Dashboard
│   ├── middleware/
│   │   └── auth.js          # Middleware de autenticação
│   ├── config/
│   │   └── database.js      # Configuração do banco
│   ├── initDatabase.js      # Inicialização do DB
│   └── server.js            # Servidor principal
├── README.md
└── package.json
```

### 🗄️ Banco de Dados (SQLite)
- **users**: Usuários do sistema
- **tools**: Ferramentas e suas informações
- **production_history**: Histórico de produção
- **swap_history**: Histórico de trocas
- **mold_comments**: Comentários por molde
- **scrap_data**: Dados de refugo

### 🔌 APIs Disponíveis

#### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário atual

#### Ferramentas
- `GET /api/tools` - Listar ferramentas
- `POST /api/tools` - Criar ferramenta
- `PUT /api/tools/:id/production` - Atualizar produção
- `PUT /api/tools/:id/swap` - Trocar ferramenta
- `DELETE /api/tools/:id` - Excluir ferramenta

#### Dashboard
- `GET /api/dashboard` - Dados completos do dashboard
- `GET /api/dashboard/kpis` - Apenas KPIs
- `GET /api/dashboard/charts` - Dados para gráficos

## 🛠️ Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev                 # Iniciar servidor em modo desenvolvimento

# Produção
npm start                   # Iniciar servidor de produção
npm run build-frontend      # Compilar frontend para produção

# Banco de dados
npm run init-db            # Inicializar/resetar banco de dados

# Instalação
npm run install-all        # Instalar todas as dependências
```

## 🔧 Desenvolvimento

### 🚧 Modo de Desenvolvimento

1. **Backend** (Terminal 1):
   ```bash
   npm run dev
   ```

2. **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

O frontend estará em `http://localhost:3000` e o backend em `http://localhost:3001`.

### 🎨 Tecnologias Utilizadas

#### Frontend
- **React 18** - Interface de usuário
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos interativos
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones

#### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **SQLite3** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **Helmet** - Segurança
- **CORS** - Controle de acesso

## 📊 Exemplos de Uso

### 1. **Adicionar Nova Ferramenta**
- Acesse a aba "Ferramentas"
- Preencha: ID do Molde, ID da Ferramenta, Vida Útil, Observações
- Clique em "Adicionar"

### 2. **Registrar Produção Diária**
- Na lista de ferramentas, encontre o molde
- Digite a quantidade no campo "Prod. Diária"
- Clique no botão verde ✓

### 3. **Trocar Ferramenta**
- Localize a ferramenta com status "Trocar Ferramenta (TF)"
- Clique no ícone de refresh (🔄)
- A produção será zerada automaticamente

### 4. **Visualizar Dashboard**
- Acesse a aba "Dashboard"
- Visualize KPIs, gráficos e análises
- Use o botão "Registrar Refugo Mensal" conforme necessário

## 🔒 Segurança

- **Autenticação JWT** com expiração de 24 horas
- **Validação de entrada** em todas as APIs
- **Rate limiting** para prevenir ataques
- **Sanitização de dados** do banco
- **CORS configurado** para desenvolvimento e produção

## 🐛 Solução de Problemas

### Problema: "Cannot connect to database"
**Solução**: Execute `npm run init-db` para recriar o banco

### Problema: "Module not found"
**Solução**: Execute `npm run install-all` para reinstalar dependências

### Problema: Login não funciona
**Solução**: Verifique se o banco foi inicializado e use as credenciais corretas

### Problema: Gráficos não aparecem
**Solução**: Verifique se o Recharts foi instalado: `cd frontend && npm install recharts`

## 📈 Próximos Passos

- [ ] Implementar relatórios em PDF
- [ ] Adicionar notificações push
- [ ] Integração com sistemas ERP
- [ ] Dashboard mobile responsivo
- [ ] Sistema de backup automático
- [ ] Análise preditiva com IA

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Consulte os logs do servidor no terminal
3. Verifique se todas as dependências estão instaladas

---

**Sistema Piloto - Gestão de Ferramentas YKK v1.0.0**  
*Desenvolvido para demonstração de conceito e prototipagem rápida*
