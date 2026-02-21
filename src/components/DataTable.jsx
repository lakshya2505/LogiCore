import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function DataTable({
  columns,        // [{ key, label, render, sortable, mono }]
  data,           // raw array
  onRowClick,     // (row) => void
  pageSize = 10,
  searchKeys,     // keys to search across
  emptyText = 'No records found',
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query && searchKeys) {
      const q = query.toLowerCase();
      rows = rows.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(q)));
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        const cmp = typeof av === 'number' ? av - bv : String(av ?? '').localeCompare(String(bv ?? ''));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, query, sortKey, sortDir, searchKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  }

  function handleSearch(e) { setQuery(e.target.value); setPage(1); }

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    if (sortKey !== col.key) return <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pageNumbers.push(i);
    else if (pageNumbers[pageNumbers.length - 1] !== '...') pageNumbers.push('...');
  }

  return (
    <div>
      {searchKeys && (
        <div className="table-toolbar">
          <div className="table-search">
            <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={handleSearch}
            />
          </div>
        </div>
      )}

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {col.label}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-state-text">{emptyText}</div>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr key={row.id || i} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <td key={col.key} className={col.mono ? 'mono' : ''}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="pagination-btns">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >‹</button>
            {pageNumbers.map((n, i) =>
              n === '...' ? (
                <span key={`el${i}`} className="pagination-btn" style={{ border: 'none', background: 'none', cursor: 'default' }}>…</span>
              ) : (
                <button
                  key={n}
                  className={`pagination-btn ${page === n ? 'active' : ''}`}
                  onClick={() => setPage(n)}
                >{n}</button>
              )
            )}
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}
