import { useState, type ReactNode } from "react";

const pageSize = 20;

export type RecordColumn<RecordType> = {
  label: string;
  render: (record: RecordType) => ReactNode;
};

type RecordTableProps<RecordType extends { id: number }> = {
  columns: RecordColumn<RecordType>[];
  records: RecordType[];
  isLoading: boolean;
  onEdit: (record: RecordType) => void;
  onDelete: (record: RecordType) => void;
};

function RecordTable<RecordType extends { id: number }>({
  columns,
  records,
  isLoading,
  onEdit,
  onDelete,
}: RecordTableProps<RecordType>) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(records.length / pageSize);
  const currentPage = Math.min(page, Math.max(pageCount - 1, 0));
  const firstRecordIndex = currentPage * pageSize;
  const visibleRecords = records.slice(firstRecordIndex, firstRecordIndex + pageSize);

  return (
    <section className="card shadow-sm admin-panel">
      <div className="card-header d-flex align-items-center justify-content-between gap-3">
        <h2 className="h5 mb-0">Registros</h2>
        <span className="text-secondary">{records.length} registros</span>
      </div>
      <div className="card-body p-0">
        {isLoading ? (
          <p className="text-center text-secondary p-4 mb-0" role="status">
            Carregando registros...
          </p>
        ) : records.length === 0 ? (
          <p className="text-center text-secondary p-4 mb-0">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0 admin-table">
              <thead>
                <tr>
                  {columns.map((column) => <th key={column.label}>{column.label}</th>)}
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visibleRecords.map((record) => (
                  <tr key={record.id}>
                    {columns.map((column) => (
                      <td key={column.label}>{column.render(record)}</td>
                    ))}
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => onEdit(record)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(record)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && (
          <div className="d-flex align-items-center justify-content-between gap-3 p-3">
            <span className="text-secondary" aria-live="polite">
              {records.length === 0
                ? "0 registros"
                : `${firstRecordIndex + 1}-${Math.min(firstRecordIndex + pageSize, records.length)} de ${records.length}`}
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary"
                aria-label="Mostrar os 20 registros anteriores"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                ←
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                aria-label="Mostrar os próximos 20 registros"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= pageCount - 1}
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default RecordTable;
