import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({ category_id: '', monthly_limit: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/categories')
      ]);
      setBudgets(budgetsRes.data.budgets);
      
      const expenses = categoriesRes.data.categories.filter(c => c.type === 'expense');
      setExpenseCategories(expenses);
      if (expenses.length > 0) {
        setFormData({ ...formData, category_id: expenses[0].id });
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.category_id || !formData.monthly_limit) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = { 
        category_id: parseInt(formData.category_id), 
        monthly_limit: parseFloat(formData.monthly_limit) 
      };
      
      // Upsert API call
      await api.post('/budgets', payload);
      setSuccess('Budget set successfully!');
      setFormData({ ...formData, monthly_limit: '' });
      fetchData(); // Refresh list to see the update
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget limit?')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/budgets/${id}`);
      setBudgets(budgets.filter(b => b.id !== id));
      setSuccess('Budget deleted successfully!');
    } catch (err) {
      setError('Failed to delete budget');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Budgets</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      {/* Set Budget Form */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-2">Set Monthly Budget</h2>
        <p className="text-sm text-gray-500 mb-4">Setting a budget for a category that already has one will update the limit.</p>
        
        <form onSubmit={handleCreateOrUpdate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category</label>
            <select 
              className="w-full border p-2 rounded focus:outline-blue-500" required
              value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            >
              {expenseCategories.length === 0 && <option value="">No expense categories available</option>}
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit</label>
            <input 
              type="number" step="0.01" min="0.01" required placeholder="0.00"
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.monthly_limit} onChange={(e) => setFormData({...formData, monthly_limit: e.target.value})}
            />
          </div>
          <button 
            type="submit" disabled={isSubmitting || expenseCategories.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Set Budget'}
          </button>
        </form>
      </div>

      {/* Budgets List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Limit</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {budgets.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No budgets set yet.</td>
              </tr>
            ) : budgets.map((b) => (
              <tr key={b.id}>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {b.category_name}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  ₹{parseFloat(b.monthly_limit).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Budgets;
