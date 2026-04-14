import React, { useEffect, useMemo, useState } from 'react';
import { getAllAuditLogs, getRecentAuditLogs } from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('DATE_DESC');

  useEffect(() => {
    loadLogs();
  }, [filterType]);

  const loadLogs = async () => {
    setLoadError('');
    try {
      if (filterType === 'RECENT_7') {
        const r = await getRecentAuditLogs(7);
        setLogs(r.data);
      } else if (filterType === 'RECENT_30') {
        const r = await getRecentAuditLogs(30);
        setLogs(r.data);
      } else {
        const r = await getAllAuditLogs();
        setLogs(r.data);
      }
    } catch (e) {
      console.error('Error loading audit logs:', e);
      setLogs([]);
      if (e?.response?.status === 403) {
        setLoadError('You do not have access to view audit logs. Admin or Manager role is required.');
      } else {
        setLoadError('Could not load audit logs from server. Please try again.');
      }
    }
  };

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by userId
    if (filterUserId) {
      result = result.filter(log => log.userId === parseInt(filterUserId));
    }

    // Filter by entityType
    if (filterEntityType) {
      result = result.filter(log => log.entityType && log.entityType.toLowerCase().includes(filterEntityType.toLowerCase()));
    }

    // Filter by search query (username, action, entityType)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        (log.username && log.username.toLowerCase().includes(q)) ||
        (log.action && log.action.toLowerCase().includes(q)) ||
        (log.entityType && log.entityType.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'DATE_DESC') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'DATE_ASC') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'USER') {
      result.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    } else if (sortBy === 'ACTION') {
      result.sort((a, b) => (a.action || '').localeCompare(b.action || ''));
    }

    return result;
  }, [logs, filterUserId, filterEntityType, searchQuery, sortBy]);

  const actionColors = {
    CREATE: '#10b981',
    UPDATE: '#3b82f6',
    DELETE: '#ef4444',
    VIEW: '#8b5cf6',
    LOGIN: '#f59e0b',
  };

  const getActionColor = (action) => {
    if (!action) return '#64748b';
    const upperAction = action.toUpperCase();
    for (const [key, color] of Object.entries(actionColors)) {
      if (upperAction.includes(key)) return color;
    }
    return '#64748b';
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
        Audit Logs
      </h1>

      {loadError && (
        <div style={{
          marginBottom: 16,
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#991b1b',
          fontSize: 13
        }}>
          {loadError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by user, action, or entity type..."
          style={{
            minWidth: 280,
            padding: '8px 10px',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 13,
            outline: 'none'
          }}
        />
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); }}
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
        >
          <option value="ALL">All time</option>
          <option value="RECENT_7">Last 7 days</option>
          <option value="RECENT_30">Last 30 days</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
        >
          <option value="DATE_DESC">Sort: Latest first</option>
          <option value="DATE_ASC">Sort: Oldest first</option>
          <option value="USER">Sort: User A-Z</option>
          <option value="ACTION">Sort: Action A-Z</option>
        </select>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Filter by Entity Type:
          <input
            value={filterEntityType}
            onChange={e => setFilterEntityType(e.target.value)}
            placeholder="e.g., Product, Order, User..."
            style={{
              marginLeft: 8,
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 12,
              width: 200,
            }}
          />
        </label>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
          Filter by User ID:
          <input
            type="number"
            value={filterUserId}
            onChange={e => setFilterUserId(e.target.value)}
            placeholder="User ID..."
            style={{
              marginLeft: 8,
              padding: '6px 10px',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              fontSize: 12,
              width: 120,
            }}
          />
        </label>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Changes'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  fontWeight: 600, color: '#374151', fontSize: 12
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                  {log.username}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: getActionColor(log.action) + '20',
                    color: getActionColor(log.action),
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    {log.action || '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {log.entityType || '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace' }}>
                  {log.entityId || '—'}
                </td>
                <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 11 }}>
                  {log.ipAddress || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {log.oldValue && (
                      <div style={{ color: '#dc2626' }} title={log.oldValue}>
                        Old: {log.oldValue.substring(0, 20)}...
                      </div>
                    )}
                    {log.newValue && (
                      <div style={{ color: '#059669' }} title={log.newValue}>
                        New: {log.newValue.substring(0, 20)}...
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, color: '#64748b', fontSize: 12 }}>
        Showing {filteredLogs.length} of {logs.length} audit logs
      </div>
    </div>
  );
}
