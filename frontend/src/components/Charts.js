import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const COLORS = {
  OK: '#22c55e',
  'Atenção!': '#f59e0b',
  'Trocar Ferramenta (TF)': '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  tertiary: '#f97316'
};

const Charts = ({ data }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico de status
  const statusData = Object.entries(data.statusCounts || {}).map(([status, count]) => ({
    name: status,
    value: count,
    color: COLORS[status] || COLORS.primary
  }));

  // Preparar dados para o gráfico de produção
  const productionData = (data.top5Production || []).map(([moldId, production]) => ({
    moldId,
    production,
    formattedProduction: production.toLocaleString('pt-BR')
  }));

  // Preparar dados para gráfico de refugo
  const scrapData = Object.entries(data.scrapByMold || {}).map(([moldId, quantity]) => ({
    moldId,
    quantity,
    formattedQuantity: quantity.toLocaleString('pt-BR')
  }));

  // Preparar dados para gráfico de trocas por mês
  const swapsByMonth = Object.entries(data.swapsByMonthAndMold || {}).map(([monthYear, molds]) => {
    const totalSwaps = Object.values(molds).reduce((total, tools) => total + tools.length, 0);
    return {
      month: monthYear,
      swaps: totalSwaps
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString('pt-BR')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {value > 0 ? value : ''}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Status das Ferramentas - Gráfico de Pizza */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Status das Ferramentas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {statusData.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Produção - Gráfico de Barras */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Top 5 - Maior Produção</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="moldId" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="production" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Refugo por Molde - Gráfico de Barras */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Refugo Total por Molde</h3>
        {scrapData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scrapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="moldId" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString('pt-BR')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantity" fill={COLORS['Trocar Ferramenta (TF)']} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Nenhum dado de refugo disponível</p>
          </div>
        )}
      </div>

      {/* Trocas por Mês - Gráfico de Linha */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Trocas por Mês</h3>
        {swapsByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={swapsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="swaps" 
                stroke={COLORS.secondary} 
                strokeWidth={3}
                dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>Nenhum histórico de trocas disponível</p>
          </div>
        )}
      </div>

      {/* Detalhes de Trocas Mensais */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 lg:col-span-2">
        <h3 className="text-xl font-bold text-gray-700 mb-4">Detalhes de Trocas por Mês</h3>
        <div className="max-h-80 overflow-y-auto pr-2">
          {Object.entries(data.swapsByMonthAndMold || {}).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(data.swapsByMonthAndMold || {}).map(([monthYear, molds]) => (
                <div key={monthYear} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-bold text-lg text-gray-800 mb-2">{monthYear}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(molds).map(([moldId, swappedTools]) => (
                      <div key={moldId} className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="font-semibold text-gray-700 mb-2">{moldId}</h5>
                        <div className="space-y-1">
                          {swappedTools.map((toolId, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              {toolId}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Total: {swappedTools.length} troca{swappedTools.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Nenhum histórico de trocas disponível</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Charts;
