import { useState, type FormEvent } from "react";
import { api } from "../api/axios";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { profissionalSchema } from "../schemas/schemas";
import { getApiErrorMessage } from "../utils/apiError";
import { toDateInput } from "../utils/format";

type Profissional = {
  id: number;
  nome: string;
  contato: string | null;
  dt_nasc: string;
  sexo: string;
  especialidade: string | null;
};

type ProfissionalForm = Omit<Profissional, "id">;

const emptyForm: ProfissionalForm = {
  nome: "",
  contato: "",
  dt_nasc: "",
  sexo: "",
  especialidade: "",
};

function ProfissionalPage({ userName }: { userName: string }) {
  const { records, isLoading, loadError, reload } = useRecords<Profissional>("/professionals", false);
  const listingPage = useListingPage("/profissionais", reload);
  const [form, setForm] = useState<ProfissionalForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const columns = [
    { label: "ID", render: (record: Profissional) => record.id },
    { label: "Nome", render: (record: Profissional) => record.nome },
    { label: "Especialidade", render: (record: Profissional) => record.especialidade || "—" },
    { label: "Contato", render: (record: Profissional) => record.contato || "—" },
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

    const validation = profissionalSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    try {
      const payload = {
        ...validation.data,
        contato: validation.data.contato || null,
        especialidade: validation.data.especialidade || null,
      };
      if (editingId === null) {
        await api.post("/professionals", payload);
      } else {
        await api.put(`/professionals/${editingId}`, payload);
      }

      setSuccess("Profissional salvo com sucesso.");
      resetForm();
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar o profissional."));
    }
  }

  async function handleDelete(record: Profissional) {
    if (!window.confirm(`Deseja excluir o profissional ${record.nome}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/professionals/${record.id}`);
      setSuccess("Profissional excluído com sucesso.");
      if (editingId === record.id) {
        resetForm();
      }
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível excluir o profissional."));
    }
  }

  return (
    <AdminPageLayout title="Profissionais" userName={userName} activePath="/profissionais">
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
              setForm({
                nome: record.nome,
                contato: record.contato ?? "",
                dt_nasc: toDateInput(record.dt_nasc),
                sexo: record.sexo,
                especialidade: record.especialidade ?? "",
              });
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
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Profissional" : "Edição de Profissional"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label" htmlFor="profissional-nome">Nome</label>
                <input
                  className="form-control"
                  id="profissional-nome"
                  maxLength={100}
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="profissional-contato">Contato (DDD + número)</label>
                <input
                  className="form-control"
                  id="profissional-contato"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.contato ?? ""}
                  onChange={(event) => setForm({ ...form, contato: event.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="profissional-nascimento">Data de nascimento</label>
                <input
                  className="form-control"
                  id="profissional-nascimento"
                  type="date"
                  required
                  value={toDateInput(form.dt_nasc)}
                  onChange={(event) => setForm({ ...form, dt_nasc: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="profissional-sexo">Sexo</label>
                <select
                  className="form-select"
                  id="profissional-sexo"
                  required
                  value={form.sexo}
                  onChange={(event) => setForm({ ...form, sexo: event.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                  <option value="O">Outro</option>
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="profissional-especialidade">Especialidade</label>
                <input
                  className="form-control"
                  id="profissional-especialidade"
                  maxLength={100}
                  value={form.especialidade ?? ""}
                  onChange={(event) => setForm({ ...form, especialidade: event.target.value })}
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

export default ProfissionalPage;
