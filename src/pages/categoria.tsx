import { useState, type FormEvent } from "react";
import { api } from "../api/axion";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { getApiErrorMessage } from "./crudUtils";

type Categoria = {
  id: number;
  nome: string;
  descricao: string | null;
};

type CategoriaForm = {
  nome: string;
  descricao: string;
};

const emptyForm: CategoriaForm = { nome: "", descricao: "" };

function CategoriaPage({ userName }: { userName: string }) {
  const { records, isLoading, loadError, reload } = useRecords<Categoria>("/categories", false);
  const listingPage = useListingPage("/categorias", reload);
  const [form, setForm] = useState<CategoriaForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const columns = [
    { label: "ID", render: (record: Categoria) => record.id },
    { label: "Nome", render: (record: Categoria) => record.nome },
    { label: "Descrição", render: (record: Categoria) => record.descricao || "—" },
  ];

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = { nome: form.nome, descricao: form.descricao || null };
      if (editingId === null) {
        await api.post("/categories", payload);
      } else {
        await api.put(`/categories/${editingId}`, payload);
      }

      setSuccess("Categoria salva com sucesso.");
      resetForm();
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar a categoria."));
    }
  }

  async function handleDelete(record: Categoria) {
    if (!window.confirm(`Deseja excluir a categoria ${record.nome}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/categories/${record.id}`);
      setSuccess("Categoria excluída com sucesso.");
      if (editingId === record.id) {
        resetForm();
      }
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível excluir a categoria."));
    }
  }

  return (
    <AdminPageLayout title="Categorias" userName={userName} activePath="/categorias">
      {error && <div className="alert alert-danger">{error}</div>}
      {loadError && <div className="alert alert-danger">{loadError}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {listingPage.isListing ? (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-primary" onClick={listingPage.showForm}>
              Voltar ao cadastro
            </button>
          </div>
          <RecordTable
            columns={columns}
            records={records}
            isLoading={isLoading}
            onEdit={(record) => {
              setForm({ nome: record.nome, descricao: record.descricao ?? "" });
              setEditingId(record.id);
              setError("");
              setSuccess("");
              listingPage.showForm();
            }}
            onDelete={(record) => void handleDelete(record)}
          />
        </>
      ) : (
      <section className="card shadow-sm admin-panel mb-4">
        <div className="card-header">
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Categoria" : "Edição de Categoria"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="categoria-nome">Nome da categoria</label>
                <input
                  className="form-control"
                  id="categoria-nome"
                  maxLength={100}
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="categoria-descricao">Descrição</label>
                <textarea
                  className="form-control"
                  id="categoria-descricao"
                  rows={3}
                  maxLength={500}
                  value={form.descricao}
                  onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              {editingId !== null && (
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancelar edição
                </button>
              )}
              <button type="button" className="btn btn-outline-primary" onClick={listingPage.showListing}>
                Listar
              </button>
              <button type="submit" className="btn btn-primary">Salvar registro</button>
            </div>
          </form>
        </div>
      </section>
      )}
    </AdminPageLayout>
  );
}

export default CategoriaPage;
