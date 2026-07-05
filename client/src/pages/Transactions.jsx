import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    amount: '', type: 'expense', category_id: '', date: new Date().toISOString().split('T')[0], note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({
    type: '', category_id: '', startDate: '', endDate: ''
  });

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    amount: '', type: 'expense', category_id: '', date: '', note: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
      if (response.data.categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: response.data.categories[0].id }));
      }
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/transactions?${params.toString()}`);
      setTransactions(response.data.transactions);
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchTransactions();
  };

  const clearFilters = () => {
    setFilters({ type: '', category_id: '', startDate: '', endDate: '' });
    // setTimeout because setState is async, and we want fetch to use empty filters
    setTimeout(() => {
      fetchTransactions();
    }, 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category_id || !formData.date) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      await api.post('/transactions', payload);
      setFormData({ ...formData, amount: '', note: '' });
      setSuccess('Transaction added successfully!');
      fetchTransactions(); // Refresh list to get proper category_name joined
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter(t => t.id !== id));
      setSuccess('Transaction deleted successfully!');
    } catch (err) {
      setError('Failed to delete transaction');
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditData({
      amount: t.amount,
      type: t.type,
      category_id: t.category_id,
      date: new Date(t.date).toISOString().split('T')[0],
      note: t.note || ''
    });
  };

  const handleUpdate = async (id) => {
    if (!editData.amount || !editData.category_id || !editData.date) return;
    setError('');
    setSuccess('');
    try {
      const payload = { ...editData, amount: parseFloat(editData.amount) };
      await api.put(`/transactions/${id}`, payload);
      setSuccess('Transaction updated successfully!');
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update transaction');
    }
  };

  // Filter categories for the Add/Edit form based on selected type
  const formCategories = categories.filter(c => c.type === formData.type);
  const editCategories = categories.filter(c => c.type === editData.type);

  if (loading && transactions.length === 0) return <Spinner />;

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Transactions</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      {/* Add Transaction Form */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.type} 
              onChange={(e) => {
                const newType = e.target.value;
                const availableCats = categories.filter(c => c.type === newType);
                setFormData({...formData, type: newType, category_id: availableCats.length ? availableCats[0].id : ''});
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              className="w-full border p-2 rounded focus:outline-blue-500" required
              value={formData.category_id} onChange={(e) => setFormData({...formData, category_id: e.target.value})}
            >
              <option value="">Select...</option>
              {formCategories.length === 0 && (
                <option value="" disabled>No {formData.type} categories found. Please create one first.</option>
              )}
              {formCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input 
              type="number" step="0.01" min="0.01" required placeholder="0.00"
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input 
              type="date" required
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <input 
              type="text" placeholder="Details..."
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>
          <button 
            type="submit" disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="bg-gray-100 p-4 rounded mb-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select name="type" value={filters.type} onChange={handleFilterChange} className="border p-2 rounded text-sm w-32">
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select name="category_id" value={filters.category_id} onChange={handleFilterChange} className="border p-2 rounded text-sm w-40">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border p-2 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border p-2 rounded text-sm" />
        </div>
        <button onClick={applyFilters} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700">Filter</button>
        <button onClick={clearFilters} className="bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm hover:bg-gray-400">Clear</button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded shadow overflow-x-auto">
        {loading ? <Spinner /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No transactions found.</td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === t.id ? (
                      <input type="date" className="border p-1 rounded w-32" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} />
                    ) : new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === t.id ? (
                      <div className="flex gap-2">
                        <select className="border p-1 rounded" value={editData.type} onChange={(e) => {
                          const newType = e.target.value;
                          const avail = categories.filter(c => c.type === newType);
                          setEditData({...editData, type: newType, category_id: avail.length ? avail[0].id : ''});
                        }}>
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                        <select className="border p-1 rounded" value={editData.category_id} onChange={(e) => setEditData({...editData, category_id: e.target.value})}>
                          {editCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <>
                        <span className={`px-2 py-0.5 rounded-full text-xs mr-2 ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {t.type}
                        </span>
                        <span className="font-medium text-gray-700">{t.category_name}</span>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingId === t.id ? (
                      <input type="text" className="border p-1 rounded w-full" value={editData.note} onChange={(e) => setEditData({...editData, note: e.target.value})} />
                    ) : t.note}
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {editingId === t.id ? (
                      <input type="number" step="0.01" min="0.01" className="border p-1 rounded w-24 text-right" value={editData.amount} onChange={(e) => setEditData({...editData, amount: e.target.value})} />
                    ) : `₹${parseFloat(t.amount).toFixed(2)}`}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {editingId === t.id ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleUpdate(t.id)} className="text-green-600 hover:text-green-900">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => startEdit(t)} className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
