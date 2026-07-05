import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#E63946', '#F4A261', '#2A9D8F'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/dashboard/summary');
        setData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  // Prepare data for PieChart (spending breakdown)
  const pieData = data.categoryBreakdown.map(cat => ({
    name: cat.categoryName,
    value: cat.totalSpent
  })).filter(cat => cat.value > 0);

  // Prepare data for BarChart (actual vs budget)
  const barData = data.categoryBreakdown.map(cat => ({
    name: cat.categoryName,
    spent: cat.totalSpent,
    budget: cat.budgetLimit || 0,
    isOverBudget: data.overBudgetCategories.includes(cat.categoryName)
  }));

  // Custom shape/cell for BarChart to highlight over-budget bars in red
  const SpentBar = (props) => {
    const { isOverBudget } = props;
    return <Cell {...props} fill={isOverBudget ? '#ef4444' : '#3b82f6'} />;
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard Summary</h1>
      
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded shadow border-t-4 border-green-500">
          <h2 className="text-gray-500 text-sm uppercase tracking-wide">Total Income (This Month)</h2>
          <p className="text-3xl font-bold text-green-600">₹{data.totalIncome}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-t-4 border-red-500">
          <h2 className="text-gray-500 text-sm uppercase tracking-wide">Total Expense (This Month)</h2>
          <p className="text-3xl font-bold text-red-600">₹{data.totalExpense}</p>
        </div>
        <div className="bg-white p-6 rounded shadow border-t-4 border-blue-500">
          <h2 className="text-gray-500 text-sm uppercase tracking-wide">Current Balance</h2>
          <p className="text-3xl font-bold text-blue-600">₹{data.balance}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Spending Breakdown</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No expenses recorded this month.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4 text-gray-700">Budget vs Actual Spending</h2>
          {barData.length === 0 ? (
             <p className="text-gray-500 text-center py-12">No expense categories to track.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => `₹${value}`} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget Limit" fill="#d1d5db" />
                  <Bar dataKey="spent" name="Actual Spent">
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isOverBudget ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Over Budget Alerts */}
      {data.overBudgetCategories.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow">
          <h3 className="text-red-800 font-bold mb-1">Over Budget Alert</h3>
          <p className="text-red-700">
            You have exceeded your monthly budget for: <strong>{data.overBudgetCategories.join(', ')}</strong>.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
