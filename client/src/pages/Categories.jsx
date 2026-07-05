import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({ name: '', type: 'expense' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', type: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/categories', formData);
      setCategories([...categories, response.data.category]);
      setFormData({ name: '', type: 'expense' });
      setSuccess('Category added successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All related transactions and budgets will also be deleted.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      setSuccess('Category deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditData({ name: category.name, type: category.type });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ name: '', type: '' });
  };

  const handleUpdate = async (id) => {
    if (!editData.name) return;
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/categories/${id}`, editData);
      setCategories(categories.map(c => c.id === id ? response.data.category : c));
      setSuccess('Category updated successfully!');
      cancelEdit();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Categories</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      {/* Create Form */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input 
              type="text" required
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              className="w-full border p-2 rounded focus:outline-blue-500"
              value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <button 
            type="submit" disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No categories found.</td>
              </tr>
            ) : categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-6 py-4">
                  {editingId === cat.id ? (
                    <input 
                      type="text" className="border p-1 rounded w-full"
                      value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})}
                    />
                  ) : cat.name}
                </td>
                <td className="px-6 py-4">
                  {editingId === cat.id ? (
                    <select 
                      className="border p-1 rounded"
                      value={editData.type} onChange={(e) => setEditData({...editData, type: e.target.value})}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {cat.type}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === cat.id ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleUpdate(cat.id)} className="text-green-600 hover:text-green-900">Save</button>
                      <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button onClick={() => startEdit(cat)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
