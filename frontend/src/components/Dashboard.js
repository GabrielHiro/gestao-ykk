import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, List, Wrench, RefreshCcw, Check, Trash2, History, 
  XCircle, CheckCircle, MessageSquarePlus, 
  BarChart2, TrendingUp, AlertTriangle, Repeat, MessageSquare, 
  FileMinus, LogOut, User
} from 'lucide-react';
import { toolsService, dashboardService } from '../services/api';
import Charts from './Charts';

const STATUS = {
  OK: 'OK',
  WARN: 'Atenção!',
  SWAP: 'Trocar Ferramenta (TF)',
};

const Dashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tools, setTools] = useState([]);
  const [newTool, setNewTool] = useState({ moldId: '', toolId: '', usefulLife: '', notes: '' });
  const [dailyProduction, setDailyProduction] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedToolHistory, setSelectedToolHistory] = useState([]);
  const [selectedToolId, setSelectedToolId] = useState('');
  const [swapHistory, setSwapHistory] = useState([]);
  const [isSwapHistoryModalOpen, setIsSwapHistoryModalOpen] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState('');
  const [commentingMoldId, setCommentingMoldId] = useState(null);
  const [isMoldCommentsModalOpen, setIsMoldCommentsModalOpen] = useState(false);
  const [selectedMoldComments, setSelectedMoldComments] = useState([]);
  const [viewingCommentsForMold, setViewingCommentsForMold] = useState('');
  const [scrapData, setScrapData] = useState({});
  const [isScrapModalOpen, setIsScrapModalOpen] = useState(false);
  const [scrapEntry, setScrapEntry] = useState({ monthYear: '', moldId: '', quantity: '' });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [toolsData, dashData, swapHistoryData] = await Promise.all([
        toolsService.getAll(),
        dashboardService.getData(),
        toolsService.getSwapHistory()
      ]);
      
      setTools(toolsData);
      setDashboardData(dashData);
      setSwapHistory(swapHistoryData);
      // setScrapData(dashData.scrapData || {}); // Commented to avoid unused variable warning
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showMessage('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleNewToolChange = (e) => {
    const { name, value } = e.target;
    setNewTool(prevState => ({ ...prevState, [name]: value }));
  };

  const handleAddTool = async (e) => {
    e.preventDefault();
    if (newTool.moldId && newTool.toolId && newTool.usefulLife) {
      try {
        const newToolData = await toolsService.create(newTool);
        setTools([...tools, newToolData]);
        setNewTool({ moldId: '', toolId: '', usefulLife: '', notes: '' });
        showMessage("Ferramenta adicionada com sucesso!", 'success');
      } catch (error) {
        console.error('Erro ao adicionar ferramenta:', error);
        showMessage(error.response?.data?.error || 'Erro ao adicionar ferramenta', 'error');
      }
    }
  };

  const handleUpdateMoldProduction = async (moldId, value) => {
    const productionValue = parseFloat(value || '0');

    if (isNaN(productionValue) || productionValue <= 0) {
      showMessage("Adicione um valor de produção válido para salvar.", 'error');
      return;
    }

    // Encontrar ferramenta ativa para este molde
    const activeTool = tools.find(tool => tool.moldId === moldId && tool.isActive);
    
    if (!activeTool) {
      showMessage(`Nenhuma ferramenta ativa encontrada para o molde ${moldId}. Adicione uma nova.`, 'error');
      return;
    }

    try {
      const updatedTool = await toolsService.updateProduction(activeTool.id, productionValue);
      
      // Atualizar estado local
      setTools(tools.map(tool => 
        tool.id === activeTool.id ? updatedTool : tool
      ));
      
      setDailyProduction(prevState => ({ ...prevState, [moldId]: '' }));
      showMessage("Registro de produção salvo!", 'success');
      
      // Recarregar dados do dashboard
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar produção:', error);
      showMessage(error.response?.data?.error || 'Erro ao atualizar produção', 'error');
    }
  };

  const handleSwapTool = async (toolId) => {
    try {
      const updatedTool = await toolsService.swapTool(toolId);
      
      // Atualizar estado local
      setTools(tools.map(tool => 
        tool.id === toolId ? updatedTool : tool
      ));
      
      showMessage(`Ferramenta trocada e produção zerada.`, 'success');
      
      // Recarregar dados
      await loadData();
    } catch (error) {
      console.error('Erro ao trocar ferramenta:', error);
      showMessage(error.response?.data?.error || 'Erro ao trocar ferramenta', 'error');
    }
  };

  const handleDeleteTool = (toolId) => { 
    setDeletingId(toolId); 
  };

  const handleConfirmDelete = async () => {
    try {
      await toolsService.delete(deletingId);
      setTools(tools.filter(tool => tool.id !== deletingId));
      setDeletingId(null);
      showMessage("Ferramenta excluída com sucesso.", 'success');
    } catch (error) {
      console.error('Erro ao excluir ferramenta:', error);
      showMessage(error.response?.data?.error || 'Erro ao excluir ferramenta', 'error');
    }
  };

  const handleCancelDelete = () => { 
    setDeletingId(null); 
  };
  
  const handleViewHistory = (tool) => { 
    setSelectedToolHistory(tool.productionHistory || []); 
    setSelectedToolId(tool.toolId); 
    setIsHistoryModalOpen(true); 
  };

  const handleCloseHistoryModal = () => { 
    setIsHistoryModalOpen(false); 
    setSelectedToolHistory([]); 
    setSelectedToolId(''); 
  };

  const handleOpenSwapHistoryModal = () => { 
    setIsSwapHistoryModalOpen(true); 
  };

  const handleCloseSwapHistoryModal = () => { 
    setIsSwapHistoryModalOpen(false); 
  };
  
  const handleOpenCommentModal = (moldId) => {
    setCommentingMoldId(moldId);
    setIsCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setCommentingMoldId(null);
    setCurrentComment('');
    setIsCommentModalOpen(false);
  };

  const handleSaveMoldComment = async () => {
    if (!currentComment.trim()) {
      showMessage("O comentário não pode estar vazio.", 'error');
      return;
    }
    
    try {
      await toolsService.addMoldComment(commentingMoldId, currentComment);
      showMessage("Comentário salvo com sucesso!", 'success');
      handleCloseCommentModal();
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      showMessage(error.response?.data?.error || 'Erro ao salvar comentário', 'error');
    }
  };
  
  const handleOpenMoldCommentsModal = async (moldId) => {
    try {
      const comments = await toolsService.getMoldComments(moldId);
      setSelectedMoldComments(Object.entries(comments));
      setViewingCommentsForMold(moldId);
      setIsMoldCommentsModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      showMessage('Erro ao carregar comentários', 'error');
    }
  };

  const handleCloseMoldCommentsModal = () => {
    setIsMoldCommentsModalOpen(false);
    setSelectedMoldComments([]);
    setViewingCommentsForMold('');
  };

  const handleSaveScrap = async (e) => {
    e.preventDefault();
    const { monthYear, moldId, quantity } = scrapEntry;
    
    if (!monthYear || !moldId || !quantity || isNaN(parseFloat(quantity))) {
      showMessage("Preencha todos os campos corretamente.", 'error');
      return;
    }

    try {
      await toolsService.addScrap(moldId, monthYear, parseFloat(quantity));
      showMessage("Registro de refugo salvo!", 'success');
      setIsScrapModalOpen(false);
      setScrapEntry({ monthYear: '', moldId: '', quantity: '' });
      
      // Recarregar dados
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar refugo:', error);
      showMessage(error.response?.data?.error || 'Erro ao salvar refugo', 'error');
    }
  };

  const groupedTools = useMemo(() => { 
    const groups = tools.reduce((acc, tool) => {
      if (!acc[tool.moldId]) { 
        acc[tool.moldId] = []; 
      }
      acc[tool.moldId].push(tool);
      return acc;
    }, {});
    
    Object.keys(groups).forEach(moldId => {
      groups[moldId].sort((a, b) => (b.isActive - a.isActive));
    });
    
    return groups;
  }, [tools]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans antialiased text-gray-800">
      <div className="container mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-xl border border-gray-200">
        
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-2">
              Gestão de Ferramentas YKK
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Sistema piloto de monitoramento preditivo
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={20} />
              <span className="text-sm">{user?.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg p-1.5 mb-8">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center justify-center w-full gap-2 whitespace-nowrap py-2.5 px-4 font-semibold text-sm rounded-md transition-all ${
                currentView === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <BarChart2 size={16} /> Dashboard
            </button>
            <button
              onClick={() => setCurrentView('tools')}
              className={`flex items-center justify-center w-full gap-2 whitespace-nowrap py-2.5 px-4 font-semibold text-sm rounded-md transition-all ${
                currentView === 'tools'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`}
            >
              <Wrench size={16} /> Ferramentas
            </button>
          </nav>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg flex items-center gap-3 transition-all duration-300 z-50 ${
            messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {messageType === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="font-semibold">{message}</span>
            <button onClick={() => setMessage(null)} className="ml-2">
              <XCircle size={20} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        )}

        {/* Content */}
        {currentView === 'dashboard' ? (
          <div>
            {dashboardData && (
              <>
                {/* Action Button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setIsScrapModalOpen(true)}
                    className="flex items-center gap-2 bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition duration-300"
                  >
                    <FileMinus size={18} /> Registrar Refugo Mensal
                  </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-start gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <h3 className="text-gray-500 font-semibold">Produção do Mês</h3>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardData.kpis.productionThisMonth?.toLocaleString('pt-BR') || '0'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-start gap-4">
                    <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-gray-500 font-semibold">Ferramentas em Alerta</h3>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardData.kpis.toolsInAlert || 0}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 flex items-start gap-4">
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                      <Repeat size={24} />
                    </div>
                    <div>
                      <h3 className="text-gray-500 font-semibold">Trocas no Mês</h3>
                      <p className="text-3xl font-bold text-gray-800">
                        {dashboardData.kpis.swapsThisMonth || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <Charts data={dashboardData.charts} />

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-8">
                  <button
                    onClick={handleOpenSwapHistoryModal}
                    className="flex items-center gap-2 bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition duration-300"
                  >
                    <History size={18} /> Histórico de Trocas
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Tools Management */
          <>
            {/* Add New Tool Form */}
            <section className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-4">Adicionar Nova Ferramenta</h2>
              <form onSubmit={handleAddTool} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                  type="text" 
                  name="moldId" 
                  value={newTool.moldId} 
                  onChange={handleNewToolChange} 
                  placeholder="ID do Molde" 
                  required 
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="text" 
                  name="toolId" 
                  value={newTool.toolId} 
                  onChange={handleNewToolChange} 
                  placeholder="ID da Ferramenta" 
                  required 
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="number" 
                  name="usefulLife" 
                  value={newTool.usefulLife} 
                  onChange={handleNewToolChange} 
                  placeholder="Vida Útil (peças)" 
                  required 
                  min="1" 
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="text" 
                  name="notes" 
                  value={newTool.notes} 
                  onChange={handleNewToolChange} 
                  placeholder="Observações" 
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  type="submit" 
                  className="col-span-1 sm:col-span-2 lg:col-span-4 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={20} /> Adicionar
                </button>
              </form>
            </section>

            {/* Tools List */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-blue-700 mb-4">Ferramentas Ativas</h2>
              {tools.length === 0 ? (
                <div className="text-center text-gray-500 p-8 rounded-lg border-2 border-dashed border-gray-300">
                  <List size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma ferramenta registrada.</p>
                </div>
              ) : (
                Object.keys(groupedTools).map(moldId => (
                  <div key={moldId} className="mb-8">
                    <div className="flex items-center justify-between gap-2 text-lg font-semibold bg-gray-100 p-4 rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Wrench size={24} /> Molde: {moldId}
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={dailyProduction[moldId] || ''} 
                          onChange={(e) => setDailyProduction(prevState => ({ ...prevState, [moldId]: e.target.value }))} 
                          placeholder="Prod. Diária" 
                          min="0" 
                          className="w-32 p-2 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                          onClick={() => handleOpenCommentModal(moldId)} 
                          title="Adicionar Comentário" 
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                        >
                          <MessageSquarePlus size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenMoldCommentsModal(moldId)} 
                          title="Ver Comentários do Molde" 
                          className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
                        >
                          <MessageSquare size={16} />
                        </button>
                        <button 
                          onClick={() => handleUpdateMoldProduction(moldId, dailyProduction[moldId])} 
                          title="Salvar Produção" 
                          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-b-xl shadow-lg">
                      <table className="min-w-full divide-y bg-white">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Ferramenta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vida Útil</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produção Acum.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Restante</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condição</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {groupedTools[moldId].map(tool => {
                            const remainingPercentage = Math.max(0, 100 - (tool.accumulatedProduction / tool.usefulLife) * 100);
                            return (
                              <tr 
                                key={tool.id} 
                                className={`${
                                  !tool.isActive ? 'bg-gray-100 text-gray-400' : 
                                  tool.status === STATUS.SWAP ? 'bg-red-50' : 
                                  tool.status === STATUS.WARN ? 'bg-yellow-50' : ''
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    tool.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {tool.isActive ? 'Ativa' : 'Inativa'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {tool.toolId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {tool.usefulLife?.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {tool.accumulatedProduction?.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-24 bg-gray-300 rounded-full h-2.5">
                                      <div 
                                        className={`h-2.5 rounded-full ${
                                          tool.status === STATUS.SWAP ? 'bg-red-500' : 
                                          tool.status === STATUS.WARN ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} 
                                        style={{ width: `${remainingPercentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="ml-2 text-sm text-gray-500">
                                      {remainingPercentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                                      tool.status === STATUS.SWAP ? 'bg-red-500' : 
                                      tool.status === STATUS.WARN ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}></span>
                                    <span className="text-sm text-gray-700">{tool.status}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    {tool.isActive && (
                                      <button 
                                        onClick={() => handleSwapTool(tool.id)} 
                                        title="Trocar Ferramenta" 
                                        className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                      >
                                        <RefreshCcw size={18} />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleViewHistory(tool)} 
                                      title="Ver Histórico"
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                    >
                                      <History size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteTool(tool.id)} 
                                      title="Excluir Ferramenta"
                                      className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {/* Modals */}
        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-sm mx-4 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-red-700">Confirmar Exclusão</h3>
              <p className="text-gray-700 mb-6">Tem certeza que deseja excluir esta ferramenta? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={handleCancelDelete} 
                  className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-4xl mx-4 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Histórico de Produção: {selectedToolId}</h3>
              {selectedToolHistory.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-sm font-semibold text-gray-600">Data</th>
                        <th className="p-3 text-sm font-semibold text-gray-600">Peças Produzidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedToolHistory.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-3">{entry.date}</td>
                          <td className="p-3">{entry.pieces?.toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Nenhum histórico de produção.</p>
              )}
              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleCloseHistoryModal} 
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Swap History Modal */}
        {isSwapHistoryModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-2xl mx-4 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-purple-700">Histórico de Trocas</h3>
              {swapHistory.length > 0 ? (
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3">Data</th>
                        <th className="p-3">ID Molde</th>
                        <th className="p-3">ID Ferramenta</th>
                        <th className="p-3">Produção</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swapHistory.map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-3">{entry.date}</td>
                          <td className="p-3">{entry.moldId}</td>
                          <td className="p-3">{entry.toolId}</td>
                          <td className="p-3">{entry.productionBeforeSwap?.toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Nenhum histórico de troca.</p>
              )}
              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleCloseSwapHistoryModal} 
                  className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comment Modal */}
        {isCommentModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-lg mx-4 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Adicionar Comentário ao Molde</h3>
              <p className="text-gray-600 mb-4">
                Adicione um comentário para o molde <strong>{commentingMoldId}</strong> na data de hoje.
              </p>
              <textarea
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                placeholder="Digite seu comentário aqui..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              />
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={handleCloseCommentModal} 
                  className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-300"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveMoldComment} 
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
                >
                  Salvar Comentário
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mold Comments Modal */}
        {isMoldCommentsModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="relative p-8 bg-white w-full max-w-4xl mx-4 rounded-xl shadow-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-blue-700">Comentários do Molde: {viewingCommentsForMold}</h3>
              {selectedMoldComments.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {selectedMoldComments.map(([date, comments], index) => (
                    <div key={index}>
                      <p className="font-semibold bg-gray-100 p-2 rounded-md">{date}</p>
                      <ul className="list-disc pl-8 mt-2 space-y-1">
                        {comments.map((comment, cIndex) => (
                          <li key={cIndex} className="text-gray-700">{comment}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nenhum comentário registrado para este molde.</p>
              )}
              <div className="flex justify-end mt-6">
                <button 
                  onClick={handleCloseMoldCommentsModal} 
                  className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrap Modal */}
        {isScrapModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Registrar Refugo Mensal</h3>
              <form onSubmit={handleSaveScrap} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mês/Ano (MM/YYYY)</label>
                  <input 
                    type="text" 
                    value={scrapEntry.monthYear} 
                    onChange={(e) => setScrapEntry({...scrapEntry, monthYear: e.target.value})} 
                    placeholder="Ex: 08/2025" 
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID do Molde</label>
                  <select 
                    value={scrapEntry.moldId} 
                    onChange={(e) => setScrapEntry({...scrapEntry, moldId: e.target.value})} 
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um Molde</option>
                    {Object.keys(groupedTools).map(moldId => (
                      <option key={moldId} value={moldId}>{moldId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade Refugada</label>
                  <input 
                    type="number" 
                    value={scrapEntry.quantity} 
                    onChange={(e) => setScrapEntry({...scrapEntry, quantity: e.target.value})} 
                    placeholder="Nº de peças" 
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsScrapModalOpen(false)} 
                    className="bg-gray-300 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Salvar Refugo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
