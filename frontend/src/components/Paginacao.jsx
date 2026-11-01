export default function Paginacao({ pagina, limite, total, onChange }) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  if (totalPaginas <= 1) return null;

  return (
    <nav>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${pagina === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(pagina - 1)}>
            &laquo;
          </button>
        </li>
        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
          <li key={p} className={`page-item ${p === pagina ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onChange(p)}>
              {p}
            </button>
          </li>
        ))}
        <li className={`page-item ${pagina === totalPaginas ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChange(pagina + 1)}>
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
}
