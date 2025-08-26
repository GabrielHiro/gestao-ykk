const database = require('./config/database');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
  try {
    await database.connect();
    
    console.log('🔧 Inicializando banco de dados...');

    // Criar tabela de usuários
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de ferramentas
    await database.run(`
      CREATE TABLE IF NOT EXISTS tools (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mold_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        useful_life INTEGER NOT NULL,
        accumulated_production INTEGER DEFAULT 0,
        status TEXT DEFAULT 'OK',
        notes TEXT,
        warning BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mold_id, tool_id)
      )
    `);

    // Criar tabela de histórico de produção
    await database.run(`
      CREATE TABLE IF NOT EXISTS production_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_id INTEGER NOT NULL,
        pieces INTEGER NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
      )
    `);

    // Criar tabela de histórico de trocas
    await database.run(`
      CREATE TABLE IF NOT EXISTS swap_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mold_id TEXT NOT NULL,
        tool_id TEXT NOT NULL,
        production_before_swap INTEGER NOT NULL,
        swap_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de comentários dos moldes
    await database.run(`
      CREATE TABLE IF NOT EXISTS mold_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mold_id TEXT NOT NULL,
        comment TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar tabela de refugo
    await database.run(`
      CREATE TABLE IF NOT EXISTS scrap_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mold_id TEXT NOT NULL,
        month_year TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mold_id, month_year)
      )
    `);

    console.log('✅ Tabelas criadas com sucesso');

    // Verificar se já existe usuário admin
    const existingAdmin = await database.get('SELECT * FROM users WHERE email = ?', ['admin@ykk.com']);
    
    if (!existingAdmin) {
      // Criar usuário administrador padrão
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await database.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        ['admin@ykk.com', hashedPassword, 'Administrador', 'admin']
      );
      console.log('👤 Usuário administrador criado: admin@ykk.com / admin123');
    }

    // Verificar se já existem ferramentas
    const existingTools = await database.all('SELECT COUNT(*) as count FROM tools');
    
    if (existingTools[0].count === 0) {
      console.log('📊 Inserindo dados iniciais de teste...');
      
      // Dados iniciais das ferramentas
      const initialTools = [
        { moldId: 'MOLDE-A', toolId: 'FER-A1', usefulLife: 100000, accumulatedProduction: 85000, status: 'Trocar Ferramenta (TF)', notes: 'Ferramenta de precisão.', warning: 1 },
        { moldId: 'MOLDE-A', toolId: 'FER-A2', usefulLife: 150000, accumulatedProduction: 30000, status: 'OK', notes: '', warning: 0 },
        { moldId: 'MOLDE-B', toolId: 'FER-B1', usefulLife: 200000, accumulatedProduction: 144000, status: 'Atenção!', notes: 'Verificar desgaste a cada 10k peças.', warning: 1 },
        { moldId: 'MOLDE-C', toolId: 'FER-C1', usefulLife: 120000, accumulatedProduction: 12000, status: 'OK', notes: '', warning: 0 },
        { moldId: 'MOLDE-D', toolId: 'FER-D1', usefulLife: 120000, accumulatedProduction: 115000, status: 'Atenção!', notes: '', warning: 1 },
        { moldId: 'MOLDE-E', toolId: 'FER-E1', usefulLife: 100000, accumulatedProduction: 95000, status: 'Trocar Ferramenta (TF)', notes: 'Urgente!', warning: 1 }
      ];

      for (const tool of initialTools) {
        const result = await database.run(
          'INSERT INTO tools (mold_id, tool_id, useful_life, accumulated_production, status, notes, warning) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tool.moldId, tool.toolId, tool.usefulLife, tool.accumulatedProduction, tool.status, tool.notes, tool.warning]
        );

        // Adicionar histórico de produção
        if (tool.accumulatedProduction > 0) {
          await database.run(
            'INSERT INTO production_history (tool_id, pieces, date) VALUES (?, ?, ?)',
            [result.id, tool.accumulatedProduction, new Date().toLocaleDateString('pt-BR')]
          );
        }
      }

      // Histórico de trocas inicial
      const initialSwapHistory = [
        { moldId: 'MOLDE-B', toolId: 'FER-B1-OLD', productionBeforeSwap: 200000, date: '2025-07-15 10:30:00' },
        { moldId: 'MOLDE-A', toolId: 'FER-A1-OLD', productionBeforeSwap: 100000, date: '2025-08-01 14:00:00' },
        { moldId: 'MOLDE-A', toolId: 'FER-A2-OLD', productionBeforeSwap: 150000, date: '2025-08-10 08:00:00' },
        { moldId: 'MOLDE-E', toolId: 'FER-E1-OLD', productionBeforeSwap: 100000, date: '2025-08-12 09:00:00' },
        { moldId: 'MOLDE-B', toolId: 'FER-B1-NEW', productionBeforeSwap: 180000, date: '2025-08-20 11:00:00' }
      ];

      for (const swap of initialSwapHistory) {
        await database.run(
          'INSERT INTO swap_history (mold_id, tool_id, production_before_swap, swap_date) VALUES (?, ?, ?, ?)',
          [swap.moldId, swap.toolId, swap.productionBeforeSwap, swap.date]
        );
      }

      // Comentários iniciais dos moldes
      const initialComments = [
        { moldId: 'MOLDE-A', comment: 'Início de produção com lote novo de matéria-prima.', date: '20/08/2025' },
        { moldId: 'MOLDE-A', comment: 'Pequeno ajuste de pressão realizado às 14h.', date: '21/08/2025' },
        { moldId: 'MOLDE-A', comment: 'Verificar rebarba nas próximas 1000 peças.', date: '21/08/2025' },
        { moldId: 'MOLDE-B', comment: 'Manutenção preventiva realizada.', date: '22/07/2025' }
      ];

      for (const comment of initialComments) {
        await database.run(
          'INSERT INTO mold_comments (mold_id, comment, date) VALUES (?, ?, ?)',
          [comment.moldId, comment.comment, comment.date]
        );
      }

      // Dados de refugo inicial
      const initialScrapData = [
        { moldId: 'MOLDE-B', monthYear: '07/2025', quantity: 1200 },
        { moldId: 'MOLDE-A', monthYear: '08/2025', quantity: 550 },
        { moldId: 'MOLDE-E', monthYear: '08/2025', quantity: 250 }
      ];

      for (const scrap of initialScrapData) {
        await database.run(
          'INSERT INTO scrap_data (mold_id, month_year, quantity) VALUES (?, ?, ?)',
          [scrap.moldId, scrap.monthYear, scrap.quantity]
        );
      }

      console.log('✅ Dados iniciais inseridos com sucesso');
    }

    console.log('🎉 Banco de dados inicializado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log('   Email: admin@ykk.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
  } finally {
    await database.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
