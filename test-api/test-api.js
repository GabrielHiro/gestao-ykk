async function testAPI() {
  try {
    console.log('🔍 Testando APIs do sistema...\n');

    // Teste 1: Health Check
    console.log('1. Testando Health Check...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);

    // Teste 2: Login
    console.log('\n2. Testando Login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@ykk.com',
        password: 'admin123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido:', loginData.message);
    console.log('👤 Usuário:', loginData.user.name);
    
    const token = loginData.token;

    // Teste 3: Buscar ferramentas
    console.log('\n3. Testando busca de ferramentas...');
    const toolsResponse = await fetch('http://localhost:3001/api/tools', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const toolsData = await toolsResponse.json();
    console.log(`✅ ${toolsData.length} ferramentas encontradas`);

    // Teste 4: Dashboard
    console.log('\n4. Testando dashboard...');
    const dashboardResponse = await fetch('http://localhost:3001/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard carregado');
    console.log('📊 KPIs:', dashboardData.kpis);

    // Teste 5: Criar nova ferramenta
    console.log('\n5. Testando criação de ferramenta...');
    const newToolResponse = await fetch('http://localhost:3001/api/tools', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        moldId: 'MOLDE-TEST',
        toolId: 'FER-TEST-001',
        usefulLife: 50000,
        notes: 'Ferramenta de teste criada via API'
      })
    });
    const newToolData = await newToolResponse.json();
    console.log('✅ Ferramenta criada:', newToolData.toolId);

    console.log('\n🎉 Todos os testes foram executados com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('✅ Health Check - OK');
    console.log('✅ Autenticação - OK');
    console.log('✅ Listagem de ferramentas - OK');
    console.log('✅ Dashboard - OK');
    console.log('✅ Criação de ferramenta - OK');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testAPI();
