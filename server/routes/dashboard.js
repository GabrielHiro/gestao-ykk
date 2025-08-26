const express = require('express');
const database = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Conectar ao banco de dados
database.connect().catch(console.error);

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/dashboard - Dados do dashboard
router.get('/', async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Buscar todas as ferramentas ativas
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

    // Processar ferramentas
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

    // Buscar histórico de trocas
    const swapHistory = await database.all(`
      SELECT 
        mold_id,
        tool_id,
        production_before_swap,
        datetime(swap_date, 'localtime') as date
      FROM swap_history
      ORDER BY swap_date DESC
    `);

    const processedSwapHistory = swapHistory.map(swap => ({
      date: new Date(swap.date).toLocaleString('pt-BR'),
      moldId: swap.mold_id,
      toolId: swap.tool_id,
      productionBeforeSwap: swap.production_before_swap
    }));

    // Buscar dados de refugo
    const scrapData = await database.all(`
      SELECT mold_id, month_year, quantity
      FROM scrap_data
      ORDER BY month_year DESC, mold_id
    `);

    // Agrupar refugo por mês/ano
    const groupedScrap = scrapData.reduce((acc, scrap) => {
      if (!acc[scrap.month_year]) {
        acc[scrap.month_year] = {};
      }
      acc[scrap.month_year][scrap.mold_id] = scrap.quantity;
      return acc;
    }, {});

    // Calcular KPIs
    const toolsInAlert = processedTools.filter(t => t.status !== 'OK').length;

    const productionThisMonth = processedTools.reduce((total, tool) => {
      return total + (tool.productionHistory || []).reduce((subtotal, entry) => {
        const [day, month, year] = entry.date.split('/');
        if (parseInt(month, 10) === currentMonth && parseInt(year, 10) === currentYear) {
          return subtotal + entry.pieces;
        }
        return subtotal;
      }, 0);
    }, 0);

    const swapsThisMonth = processedSwapHistory.filter(swap => {
      const [datePart] = swap.date.split(',');
      const [day, month, year] = datePart.split('/');
      return parseInt(month, 10) === currentMonth && parseInt(year, 10) === currentYear;
    }).length;

    // Dados para gráficos
    const statusCounts = processedTools.reduce((acc, tool) => {
      acc[tool.status] = (acc[tool.status] || 0) + 1;
      return acc;
    }, { 'OK': 0, 'Atenção!': 0, 'Trocar Ferramenta (TF)': 0 });

    const top5Production = Object.entries(processedTools.reduce((acc, tool) => {
      acc[tool.moldId] = (acc[tool.moldId] || 0) + tool.accumulatedProduction;
      return acc;
    }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const swapsByMonthAndMold = processedSwapHistory.reduce((acc, swap) => {
      const [datePart] = swap.date.split(',');
      const [day, month, year] = datePart.split('/');
      const monthYear = `${month}/${year}`;

      if (!acc[monthYear]) acc[monthYear] = {};
      if (!acc[monthYear][swap.moldId]) acc[monthYear][swap.moldId] = [];
      acc[monthYear][swap.moldId].push(swap.toolId);
      return acc;
    }, {});

    const scrapByMold = Object.values(groupedScrap).reduce((acc, monthlyData) => {
      for (const moldId in monthlyData) {
        acc[moldId] = (acc[moldId] || 0) + monthlyData[moldId];
      }
      return acc;
    }, {});

    const maxScrap = Math.max(...Object.values(scrapByMold), 1);

    // Resposta do dashboard
    const dashboardData = {
      kpis: {
        toolsInAlert,
        productionThisMonth,
        swapsThisMonth
      },
      charts: {
        statusCounts,
        top5Production,
        swapsByMonthAndMold,
        scrapByMold,
        maxScrap
      },
      tools: processedTools,
      swapHistory: processedSwapHistory,
      scrapData: groupedScrap
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/dashboard/kpis - Apenas KPIs
router.get('/kpis', async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Ferramentas em alerta
    const toolsInAlert = await database.get(`
      SELECT COUNT(*) as count 
      FROM tools 
      WHERE is_active = 1 AND status != 'OK'
    `);

    // Produção do mês atual
    const productionThisMonth = await database.get(`
      SELECT COALESCE(SUM(ph.pieces), 0) as total
      FROM production_history ph
      WHERE substr(ph.date, 4, 2) = ? AND substr(ph.date, 7, 4) = ?
    `, [currentMonth.toString().padStart(2, '0'), currentYear.toString()]);

    // Trocas do mês atual
    const swapsThisMonth = await database.get(`
      SELECT COUNT(*) as count
      FROM swap_history
      WHERE strftime('%m', swap_date) = ? AND strftime('%Y', swap_date) = ?
    `, [currentMonth.toString().padStart(2, '0'), currentYear.toString()]);

    res.json({
      toolsInAlert: toolsInAlert.count,
      productionThisMonth: productionThisMonth.total,
      swapsThisMonth: swapsThisMonth.count
    });
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/dashboard/charts - Dados para gráficos
router.get('/charts', async (req, res) => {
  try {
    // Status das ferramentas
    const statusCounts = await database.all(`
      SELECT status, COUNT(*) as count
      FROM tools
      WHERE is_active = 1
      GROUP BY status
    `);

    const processedStatusCounts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, { 'OK': 0, 'Atenção!': 0, 'Trocar Ferramenta (TF)': 0 });

    // Top 5 produção por molde
    const top5Production = await database.all(`
      SELECT mold_id, SUM(accumulated_production) as total_production
      FROM tools
      WHERE is_active = 1
      GROUP BY mold_id
      ORDER BY total_production DESC
      LIMIT 5
    `);

    const processedTop5 = top5Production.map(item => [item.mold_id, item.total_production]);

    // Refugo por molde
    const scrapByMold = await database.all(`
      SELECT mold_id, SUM(quantity) as total_scrap
      FROM scrap_data
      GROUP BY mold_id
      ORDER BY total_scrap DESC
    `);

    const processedScrap = scrapByMold.reduce((acc, item) => {
      acc[item.mold_id] = item.total_scrap;
      return acc;
    }, {});

    const maxScrap = Math.max(...Object.values(processedScrap), 1);

    // Trocas por mês e molde
    const swapsByMonth = await database.all(`
      SELECT 
        strftime('%m/%Y', swap_date) as month_year,
        mold_id,
        tool_id
      FROM swap_history
      ORDER BY swap_date DESC
    `);

    const swapsByMonthAndMold = swapsByMonth.reduce((acc, swap) => {
      if (!acc[swap.month_year]) acc[swap.month_year] = {};
      if (!acc[swap.month_year][swap.mold_id]) acc[swap.month_year][swap.mold_id] = [];
      acc[swap.month_year][swap.mold_id].push(swap.tool_id);
      return acc;
    }, {});

    res.json({
      statusCounts: processedStatusCounts,
      top5Production: processedTop5,
      scrapByMold: processedScrap,
      maxScrap,
      swapsByMonthAndMold
    });
  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
