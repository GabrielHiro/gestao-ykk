const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Conectar ao banco de dados
database.connect().catch(console.error);

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/tools - Listar todas as ferramentas
router.get('/', async (req, res) => {
  try {
    const tools = await database.all(`
      SELECT 
        t.*,
        GROUP_CONCAT(
          json_object(
            'date', ph.date,
            'pieces', ph.pieces
          )
        ) as production_history
      FROM tools t
      LEFT JOIN production_history ph ON t.id = ph.tool_id
      WHERE t.is_active = 1
      GROUP BY t.id
      ORDER BY t.mold_id, t.tool_id
    `);

    // Processar histórico de produção
    const processedTools = tools.map(tool => {
      let productionHistory = [];
      
      if (tool.production_history) {
        try {
          // Tentar fazer o parse do JSON
          productionHistory = tool.production_history.split(',').map(item => {
            try {
              return JSON.parse(item);
            } catch (e) {
              console.warn('Erro ao fazer parse do item de histórico:', item);
              return null;
            }
          }).filter(item => item !== null);
        } catch (e) {
          console.warn('Erro ao processar histórico de produção:', e);
          productionHistory = [];
        }
      }

      return {
        id: tool.id,
        moldId: tool.mold_id,
        toolId: tool.tool_id,
        usefulLife: tool.useful_life,
        accumulatedProduction: tool.accumulated_production,
        status: tool.status,
        notes: tool.notes || '',
        warning: Boolean(tool.warning),
        isActive: Boolean(tool.is_active),
        lastUpdate: new Date(tool.updated_at).toLocaleDateString('pt-BR'),
        productionHistory: productionHistory
      };
    });

    res.json(processedTools);
  } catch (error) {
    console.error('Erro ao buscar ferramentas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tools - Criar nova ferramenta
router.post('/', async (req, res) => {
  try {
    const { moldId, toolId, usefulLife, notes } = req.body;

    // Validação
    if (!moldId || !toolId || !usefulLife) {
      return res.status(400).json({ error: 'moldId, toolId e usefulLife são obrigatórios' });
    }

    if (usefulLife <= 0) {
      return res.status(400).json({ error: 'Vida útil deve ser maior que zero' });
    }

    // Verificar se já existe ferramenta com mesmo moldId e toolId
    const existingTool = await database.get(
      'SELECT id FROM tools WHERE mold_id = ? AND tool_id = ?',
      [moldId, toolId]
    );

    if (existingTool) {
      return res.status(409).json({ error: 'Já existe uma ferramenta com este ID para este molde' });
    }

    // Inserir nova ferramenta
    const result = await database.run(`
      INSERT INTO tools (mold_id, tool_id, useful_life, notes, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [moldId, toolId, parseInt(usefulLife), notes || '']);

    // Buscar ferramenta criada
    const newTool = await database.get('SELECT * FROM tools WHERE id = ?', [result.id]);

    const processedTool = {
      id: newTool.id,
      moldId: newTool.mold_id,
      toolId: newTool.tool_id,
      usefulLife: newTool.useful_life,
      accumulatedProduction: newTool.accumulated_production,
      status: newTool.status,
      notes: newTool.notes || '',
      warning: Boolean(newTool.warning),
      isActive: Boolean(newTool.is_active),
      lastUpdate: new Date(newTool.updated_at).toLocaleDateString('pt-BR'),
      productionHistory: []
    };

    res.status(201).json(processedTool);
  } catch (error) {
    console.error('Erro ao criar ferramenta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/tools/:id/production - Atualizar produção de uma ferramenta
router.put('/:id/production', async (req, res) => {
  try {
    const { id } = req.params;
    const { pieces } = req.body;

    if (!pieces || pieces <= 0) {
      return res.status(400).json({ error: 'Número de peças deve ser maior que zero' });
    }

    // Buscar ferramenta
    const tool = await database.get('SELECT * FROM tools WHERE id = ? AND is_active = 1', [id]);

    if (!tool) {
      return res.status(404).json({ error: 'Ferramenta não encontrada ou inativa' });
    }

    const newAccumulatedProduction = tool.accumulated_production + parseInt(pieces);
    const consumedPercentage = newAccumulatedProduction / tool.useful_life;

    // Determinar novo status
    let newStatus = 'OK';
    let newWarning = 0;

    if (consumedPercentage >= 0.8) {
      newStatus = 'Trocar Ferramenta (TF)';
      newWarning = 1;
    } else if (consumedPercentage >= 0.7) {
      newStatus = 'Atenção!';
      newWarning = 1;
    }

    // Atualizar ferramenta
    await database.run(`
      UPDATE tools 
      SET accumulated_production = ?, status = ?, warning = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [newAccumulatedProduction, newStatus, newWarning, id]);

    // Adicionar ao histórico de produção
    await database.run(`
      INSERT INTO production_history (tool_id, pieces, date)
      VALUES (?, ?, ?)
    `, [id, parseInt(pieces), new Date().toLocaleDateString('pt-BR')]);

    // Buscar ferramenta atualizada
    const updatedTool = await database.get('SELECT * FROM tools WHERE id = ?', [id]);

    const processedTool = {
      id: updatedTool.id,
      moldId: updatedTool.mold_id,
      toolId: updatedTool.tool_id,
      usefulLife: updatedTool.useful_life,
      accumulatedProduction: updatedTool.accumulated_production,
      status: updatedTool.status,
      notes: updatedTool.notes || '',
      warning: Boolean(updatedTool.warning),
      isActive: Boolean(updatedTool.is_active),
      lastUpdate: new Date(updatedTool.updated_at).toLocaleDateString('pt-BR')
    };

    res.json(processedTool);
  } catch (error) {
    console.error('Erro ao atualizar produção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/tools/:id/swap - Trocar ferramenta (zerar produção)
router.put('/:id/swap', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar ferramenta
    const tool = await database.get('SELECT * FROM tools WHERE id = ? AND is_active = 1', [id]);

    if (!tool) {
      return res.status(404).json({ error: 'Ferramenta não encontrada ou inativa' });
    }

    // Registrar troca no histórico
    await database.run(`
      INSERT INTO swap_history (mold_id, tool_id, production_before_swap)
      VALUES (?, ?, ?)
    `, [tool.mold_id, tool.tool_id, tool.accumulated_production]);

    // Zerar produção e resetar status
    await database.run(`
      UPDATE tools 
      SET accumulated_production = 0, status = 'OK', warning = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    // Limpar histórico de produção da ferramenta
    await database.run('DELETE FROM production_history WHERE tool_id = ?', [id]);

    // Buscar ferramenta atualizada
    const updatedTool = await database.get('SELECT * FROM tools WHERE id = ?', [id]);

    const processedTool = {
      id: updatedTool.id,
      moldId: updatedTool.mold_id,
      toolId: updatedTool.tool_id,
      usefulLife: updatedTool.useful_life,
      accumulatedProduction: updatedTool.accumulated_production,
      status: updatedTool.status,
      notes: updatedTool.notes || '',
      warning: Boolean(updatedTool.warning),
      isActive: Boolean(updatedTool.is_active),
      lastUpdate: new Date(updatedTool.updated_at).toLocaleDateString('pt-BR'),
      productionHistory: []
    };

    res.json(processedTool);
  } catch (error) {
    console.error('Erro ao trocar ferramenta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/tools/:id - Excluir ferramenta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se ferramenta existe
    const tool = await database.get('SELECT * FROM tools WHERE id = ?', [id]);

    if (!tool) {
      return res.status(404).json({ error: 'Ferramenta não encontrada' });
    }

    // Excluir ferramenta (CASCADE irá excluir histórico de produção)
    await database.run('DELETE FROM tools WHERE id = ?', [id]);

    res.json({ message: 'Ferramenta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ferramenta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tools/swap-history - Histórico de trocas
router.get('/swap-history', async (req, res) => {
  try {
    const swapHistory = await database.all(`
      SELECT 
        mold_id,
        tool_id,
        production_before_swap,
        datetime(swap_date, 'localtime') as date
      FROM swap_history
      ORDER BY swap_date DESC
    `);

    const processedHistory = swapHistory.map(swap => ({
      date: new Date(swap.date).toLocaleString('pt-BR'),
      moldId: swap.mold_id,
      toolId: swap.tool_id,
      productionBeforeSwap: swap.production_before_swap
    }));

    res.json(processedHistory);
  } catch (error) {
    console.error('Erro ao buscar histórico de trocas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tools/mold-comments - Adicionar comentário ao molde
router.post('/mold-comments', async (req, res) => {
  try {
    const { moldId, comment } = req.body;

    if (!moldId || !comment) {
      return res.status(400).json({ error: 'moldId e comment são obrigatórios' });
    }

    await database.run(`
      INSERT INTO mold_comments (mold_id, comment, date)
      VALUES (?, ?, ?)
    `, [moldId, comment, new Date().toLocaleDateString('pt-BR')]);

    res.json({ message: 'Comentário adicionado com sucesso' });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tools/mold-comments/:moldId - Buscar comentários do molde
router.get('/mold-comments/:moldId', async (req, res) => {
  try {
    const { moldId } = req.params;

    const comments = await database.all(`
      SELECT comment, date
      FROM mold_comments
      WHERE mold_id = ?
      ORDER BY created_at DESC
    `, [moldId]);

    // Agrupar por data
    const groupedComments = comments.reduce((acc, comment) => {
      if (!acc[comment.date]) {
        acc[comment.date] = [];
      }
      acc[comment.date].push(comment.comment);
      return acc;
    }, {});

    res.json(groupedComments);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tools/scrap - Registrar refugo
router.post('/scrap', async (req, res) => {
  try {
    const { moldId, monthYear, quantity } = req.body;

    if (!moldId || !monthYear || !quantity) {
      return res.status(400).json({ error: 'moldId, monthYear e quantity são obrigatórios' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que zero' });
    }

    // Inserir ou atualizar refugo
    await database.run(`
      INSERT OR REPLACE INTO scrap_data (mold_id, month_year, quantity)
      VALUES (?, ?, ?)
    `, [moldId, monthYear, parseInt(quantity)]);

    res.json({ message: 'Refugo registrado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar refugo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tools/scrap - Buscar dados de refugo
router.get('/scrap', async (req, res) => {
  try {
    const scrapData = await database.all(`
      SELECT mold_id, month_year, quantity
      FROM scrap_data
      ORDER BY month_year DESC, mold_id
    `);

    // Agrupar por mês/ano
    const groupedScrap = scrapData.reduce((acc, scrap) => {
      if (!acc[scrap.month_year]) {
        acc[scrap.month_year] = {};
      }
      acc[scrap.month_year][scrap.mold_id] = scrap.quantity;
      return acc;
    }, {});

    res.json(groupedScrap);
  } catch (error) {
    console.error('Erro ao buscar dados de refugo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
