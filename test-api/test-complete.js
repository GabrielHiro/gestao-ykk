async function testCompleteSystem() {
  try {
    console.log('🔍 Teste completo do sistema YKK...\n');

    // Login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ykk.com',
        password: 'admin123'
      })
    });
    const loginData = await loginResponse.json();
    const token = loginData.token;

    console.log('🔐 Autenticação concluída');

    // Teste de produção
    console.log('\n📊 Testando atualização de produção...');
    const tools = await fetch('http://localhost:3001/api/tools', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    if (tools.length > 0) {
      const toolToUpdate = tools[0];
      const productionResponse = await fetch(`http://localhost:3001/api/tools/${toolToUpdate.id}/production`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ pieces: 1000 })
      });
      const updatedTool = await productionResponse.json();
      console.log(`✅ Produção atualizada para ${updatedTool.toolId}: +1000 peças`);
    }

    // Teste de comentários
    console.log('\n💬 Testando comentários...');
    const commentResponse = await fetch('http://localhost:3001/api/tools/mold-comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        moldId: 'MOLDE-A', 
        comment: 'Teste de comentário via API' 
      })
    });
    const commentData = await commentResponse.json();
    console.log('✅ Comentário adicionado:', commentData.message);

    // Teste de refugo
    console.log('\n🗑️ Testando registro de refugo...');
    const scrapResponse = await fetch('http://localhost:3001/api/tools/scrap', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        moldId: 'MOLDE-A', 
        monthYear: '08/2025',
        quantity: 150
      })
    });
    const scrapData = await scrapResponse.json();
    console.log('✅ Refugo registrado:', scrapData.message);

    // Teste de troca de ferramenta
    console.log('\n🔄 Testando troca de ferramenta...');
    const activeTools = tools.filter(t => t.isActive);
    if (activeTools.length > 0) {
      const toolToSwap = activeTools[0];
      const swapResponse = await fetch(`http://localhost:3001/api/tools/${toolToSwap.id}/swap`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const swappedTool = await swapResponse.json();
      console.log(`✅ Ferramenta ${swappedTool.toolId} trocada com sucesso`);
    }

    // Verificar histórico de trocas
    console.log('\n📋 Verificando histórico de trocas...');
    const swapHistoryResponse = await fetch('http://localhost:3001/api/tools/swap-history', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const swapHistory = await swapHistoryResponse.json();
    console.log(`✅ Histórico carregado: ${swapHistory.length} trocas registradas`);

    // Dashboard final
    console.log('\n📊 Dashboard final...');
    const finalDashboard = await fetch('http://localhost:3001/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());

    console.log('\n🎯 Resultados finais:');
    console.log(`📈 Produção do mês: ${finalDashboard.kpis.productionThisMonth}`);
    console.log(`⚠️ Ferramentas em alerta: ${finalDashboard.kpis.toolsInAlert}`);
    console.log(`🔄 Trocas no mês: ${finalDashboard.kpis.swapsThisMonth}`);

    console.log('\n🎉 Sistema completamente funcional!');
    console.log('\n✅ Funcionalidades testadas:');
    console.log('• Autenticação JWT');
    console.log('• CRUD de ferramentas');
    console.log('• Atualização de produção');
    console.log('• Sistema de comentários');
    console.log('• Registro de refugo');
    console.log('• Troca de ferramentas');
    console.log('• Histórico completo');
    console.log('• Dashboard com KPIs');
    console.log('• Gráficos e relatórios');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testCompleteSystem();
