export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null;

  const items = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);

  for (let i = start; i <= end; i++) {
    items.push(
      <button
        key={i}
        className={`pagination-btn ${i === page ? 'active' : ''}`}
        onClick={() => onPageChange(i)}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="pagination-wrapper">
      <button
        className="pagination-btn"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      {items}
      <button
        className="pagination-btn"
        disabled={page === pages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
