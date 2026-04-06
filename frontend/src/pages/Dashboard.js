import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import { getDashboard, getLowStock, getOrders, getAlerts, getReceivedVsSold } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatNrs = (value) => `NRS ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #e2e8f0', flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || '#0f172a' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const { isManager } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [receivedVsSold, setReceivedVsSold] = useState(null);

  useEffect(() => {
    getDashboard().then(r => setStats(r.data)).catch(() => {});
    if (isManager()) {
      getLowStock().then(r => setLowStock(r.data)).catch(() => {});
      getOrders().then(r => setOrders(r.data.slice(0, 5))).catch(() => {});
      getAlerts().then(r => setAlerts(r.data.filter(a => !a.isRead).slice(0, 4))).catch(() => {});
      getReceivedVsSold(7)
        .then(r => {
          if (r.data) setReceivedVsSold(r.data);
        })
        .catch(err => {
          console.error('Error fetching received vs sold:', err);
          setReceivedVsSold({ received: 0, sold: 0 });
        });
    }
  }, []);

  const stockData = lowStock.slice(0, 6).map(p => ({
    name: p.name.length > 12 ? p.name.substring(0, 12) + '…' : p.name,
    qty: p.quantityOnHand, min: p.reorderLevel
  }));

  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Approved', value: orders.filter(o => o.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Received', value: orders.filter(o => o.status === 'RECEIVED').length, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const severityColor = { CRITICAL: '#ef4444', WARNING: '#f59e0b', INFO: '#3b82f6' };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
        Dashboard
      </h1>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total Products" value={stats?.totalProducts ?? '—'} sub="Active SKUs" />
        <StatCard label="Low Stock Items" value={stats?.lowStockCount ?? '—'}
          color={stats?.lowStockCount > 0 ? '#ef4444' : '#10b981'}
          sub="Need reordering" />
        <StatCard label="Inventory Value"
          value={stats ? formatNrs(stats.totalInventoryValue) : '—'}
          sub="Total cost value" />
        <StatCard label="Active Products" value={stats?.activeProducts ?? '—'}
          sub="In catalog" color="#3b82f6" />
        <StatCard label="Potential Profit"
          value={stats ? formatNrs(stats.potentialProfit) : '—'}
          sub={stats ? `Margin ${Number(stats.profitMarginPercent || 0).toFixed(2)}%` : 'Based on current stock'}
          color={(Number(stats?.potentialProfit || 0) >= 0) ? '#10b981' : '#ef4444'} />
      </div>

      {/* Charts row */}
      {isManager() && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Received vs Sold */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              Received vs Sold (7 days)
            </h3>
            {receivedVsSold ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Received', value: receivedVsSold.received, fill: '#10b981' },
                  { name: 'Sold', value: receivedVsSold.sold, fill: '#f59e0b' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #dbeafe', background: '#f8fbff' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  />
                  <Bar dataKey="value" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              Low stock levels
            </h3>
            {stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stockData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #dbeafe', background: '#f8fbff' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  />
                  <Bar dataKey="qty" fill="#0ea5e9" name="Current" radius={[6,6,0,0]} />
                  <Bar dataKey="min" fill="#fb7185" name="Min required" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#10b981', fontSize: 14 }}>
                All stock levels are healthy ✓
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              Order status
            </h3>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={34} outerRadius={78}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}>
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No orders yet</div>
            )}
          </div>
        </div>
      )}

      {/* Bottom row */}
      {isManager() && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* AI Alerts */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              AI Alerts
            </h3>
            {alerts.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No unread alerts</div>
            ) : alerts.map(a => (
              <div key={a.id} style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 8,
                background: severityColor[a.severity] + '15',
                borderLeft: `3px solid ${severityColor[a.severity]}`
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: severityColor[a.severity] }}>
                  {a.severity} — {a.title}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {a.message?.substring(0, 80)}...
                </div>
              </div>
            ))}
          </div>

          {/* Recent orders */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
              Recent orders
            </h3>
            {orders.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No orders yet</div>
            ) : orders.map(o => {
              const color = { PENDING:'#f59e0b', APPROVED:'#10b981',
                RECEIVED:'#3b82f6', CANCELLED:'#ef4444', DRAFT:'#94a3b8' };
              return (
                <div key={o.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{o.orderNo}</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{o.supplierName}</div>
                  </div>
                  <span style={{
                    background: (color[o.status] || '#94a3b8') + '20',
                    color: color[o.status] || '#94a3b8',
                    padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600
                  }}>{o.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
