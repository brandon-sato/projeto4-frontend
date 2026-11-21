import { useState, type FormEvent } from "react";
import { api } from "../api/axion";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { formatDate, getApiErrorMessage, toDateInput } from "./crudUtils";

type Cliente = {
  id: number;
  nome: string;
  dt_nasc: string;
  sexo: string;
  cpf: string | null;
  contato: string | null;
};

type ClienteForm = Omit<Cliente, "id">;

const emptyForm: ClienteForm = {
  nome: "",
  dt_nasc: "",
  sexo: "",
  cpf: "",
  contato: "",
};

function ClientePage({ userName }: { userName: string }) {
  const { records, isLoading, loadError, reload } = useRecords<Cliente>("/clients", false);
  const listingPage = useListingPage("/clientes", reload);
  const [form, setForm] = useState<ClienteForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const columns = [
    { label: "ID", render: (record: Cliente) => record.id },
    { label: "Nome", render: (record: Cliente) => record.nome },
    { label: "CPF", render: (record: Cliente) => record.cpf || "—" },
    { label: "Contato", render: (record: Cliente) => record.contato || "—" },
    { label: "Nascimento", render: (record: Cliente) => formatDate(record.dt_nasc) },
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
      const payload = {
        ...form,
        cpf: form.cpf || null,
        contato: form.contato || null,
      };
      if (editingId === null) {
        await api.post("/clients", payload);
      } else {
        await api.put(`/clients/${editingId}`, payload);
      }

      setSuccess("Cliente salvo com sucesso.");
      resetForm();
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar o cliente."));
    }
  }

  async function handleDelete(record: Cliente) {
    if (!window.confirm(`Deseja excluir o cliente ${record.nome}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/clients/${record.id}`);
      setSuccess("Cliente excluído com sucesso.");
      if (editingId === record.id) {
        resetForm();
      }
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível excluir o cliente."));
    }
  }

  return (
    <AdminPageLayout title="Clientes" userName={userName} activePath="/clientes">
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
                dt_nasc: toDateInput(record.dt_nasc),
                sexo: record.sexo,
                cpf: record.cpf ?? "",
                contato: record.contato ?? "",
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
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Cliente" : "Edição de Cliente"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label" htmlFor="cliente-nome">Nome</label>
                <input
                  className="form-control"
                  id="cliente-nome"
                  maxLength={150}
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cliente-nascimento">Data de nascimento</label>
                <input
                  className="form-control"
                  id="cliente-nascimento"
                  type="date"
                  required
                  value={toDateInput(form.dt_nasc)}
                  onChange={(event) => setForm({ ...form, dt_nasc: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cliente-sexo">Sexo</label>
                <select
                  className="form-select"
                  id="cliente-sexo"
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
                <label className="form-label" htmlFor="cliente-cpf">CPF (11 dígitos)</label>
                <input
                  className="form-control"
                  id="cliente-cpf"
                  inputMode="numeric"
                  maxLength={11}
                  required
                  value={form.cpf ?? ""}
                  onChange={(event) => setForm({ ...form, cpf: event.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="cliente-contato">Contato (DDD + número)</label>
                <input
                  className="form-control"
                  id="cliente-contato"
                  inputMode="numeric"
                  maxLength={11}
                  value={form.contato ?? ""}
                  onChange={(event) => setForm({ ...form, contato: event.target.value.replace(/\D/g, "").slice(0, 11) })}
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

export default ClientePage;
