import React, { useEffect, useState } from 'react';
import { getProducts, adjustStock, getMovements } from '../services/api';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ movementType: 'IN', quantity: '', notes: '', referenceNo: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { getProducts().then(r => setProducts(r.data)).catch(() => {}); }, []);

  const selectProduct = (p) => {
    setSelected(p);
    setMsg('');
    getMovements(p.id).then(r => setMovements(r.data)).catch(() => {});
  };

  const handleAdjust = async () => {
    if (!form.quantity) return;
    setLoading(true);
    try {
      await adjustStock(selected.id, { ...form, quantity: parseInt(form.quantity) });
      setMsg('Stock updated successfully');
      getProducts().then(r => { setProducts(r.data); setSelected(r.data.find(p => p.id === selected.id)); });
      getMovements(selected.id).then(r => setMovements(r.data));
      setForm(f => ({ ...f, quantity: '', notes: '', referenceNo: '' }));
    } catch (e) { setMsg('Error: ' + (e.response?.data?.message || e.message)); }
    finally { setLoading(false); }
  };

  const typeColor = { IN: '#10b981', OUT: '#ef4444', ADJUSTMENT: '#f59e0b', RETURN: '#3b82f6', TRANSFER: '#8b5cf6' };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Stock Management</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* Product list */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 14 }}>
            Products — click to manage stock
          </div>
          <div style={{ maxHeight: 600, overflow: 'auto' }}>
            {products.map(p => (
              <div key={p.id} onClick={() => selectProduct(p)} style={{
                padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                background: selected?.id === p.id ? '#eff6ff' : '#fff',
                borderLeft: selected?.id === p.id ? '3px solid #3b82f6' : '3px solid transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: p.isLowStock ? '#ef4444' : '#10b981' }}>
                      {p.quantityOnHand}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>min {p.reorderLevel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selected ? (
            <>
              {/* Adjust form */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>{selected.name}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Movement Type</label>
                    <select style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                      value={form.movementType} onChange={e => setForm(f => ({ ...f, movementType: e.target.value }))}>
                      <option value="IN">IN (receive stock)</option>
                      <option value="OUT">OUT (issue stock)</option>
                      <option value="ADJUSTMENT">ADJUSTMENT (set qty)</option>
                      <option value="RETURN">RETURN</option>
                      <option value="TRANSFER">TRANSFER</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Quantity*</label>
                    <input type="number" style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                      value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Reference No</label>
                    <input style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                      value={form.referenceNo} onChange={e => setForm(f => ({ ...f, referenceNo: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Notes</label>
                    <input style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
                      value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                {msg && <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13,
                  background: msg.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                  color: msg.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{msg}</div>}
                <button onClick={handleAdjust} disabled={loading} style={{
                  width: '100%', padding: '10px', background: '#1e40af', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>{loading ? 'Updating...' : 'Update Stock'}</button>
              </div>

              {/* Movements history */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Movement History</h3>
                <div style={{ maxHeight: 280, overflow: 'auto' }}>
                  {movements.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 13 }}>No movements yet</div>
                  : movements.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 }}>
                      <div>
                        <span style={{ fontWeight: 600, color: typeColor[m.movementType] }}>{m.movementType}</span>
                        <span style={{ color: '#64748b', marginLeft: 8 }}>{m.username}</span>
                        {m.notes && <span style={{ color: '#94a3b8', marginLeft: 6 }}>— {m.notes}</span>}
                      </div>
                      <div style={{ fontWeight: 700, color: ['IN','RETURN'].includes(m.movementType) ? '#10b981' : '#ef4444' }}>
                        {['IN','RETURN'].includes(m.movementType) ? '+' : '-'}{m.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
              padding: 60, textAlign: 'center', color: '#94a3b8' }}>
              Select a product to manage its stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
