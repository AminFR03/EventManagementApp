import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../api';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="hero">
        <h1>Browse by Category</h1>
        <p>Find events that match your interests</p>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading categories...</p></div>
      ) : (
        <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {categories.map(category => (
            <div 
              key={category.id} 
              className="card category-card" 
              style={{ cursor: 'pointer', textAlign: 'center', padding: '2rem', borderTop: `4px solid ${category.color}` }}
              onClick={() => navigate(`/?category=${category.id}`)}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{category.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{category.name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {category.description}
              </p>
              <div className="badge badge-primary">
                {category.event_count} Events
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
