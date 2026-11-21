import { useState, type FormEvent } from "react";
import { api } from "../api/axios";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { usuarioSchema } from "../schemas/schemas";
import { getApiErrorMessage } from "../utils/apiError";

type Usuario = {
  id: number;
  name: string;
  email: string;
  cpf: string;
};

type UsuarioForm = {
  name: string;
  email: string;
  cpf: string;
  password: string;
  confirmarSenha: string;
};

const emptyForm: UsuarioForm = {
  name: "",
  email: "",
  cpf: "",
  password: "",
  confirmarSenha: "",
};

function UsuarioPage({ userName }: { userName: string }) {
  const { records, isLoading, loadError, reload } = useRecords<Usuario>("/users", false);
  const listingPage = useListingPage("/usuarios", reload);
  const [form, setForm] = useState<UsuarioForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const columns = [
    { label: "ID", render: (record: Usuario) => record.id },
    { label: "Nome", render: (record: Usuario) => record.name },
    { label: "E-mail", render: (record: Usuario) => record.email },
    { label: "CPF", render: (record: Usuario) => record.cpf },
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

    const validation = usuarioSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    try {
      const payload = {
        name: validation.data.name,
        email: validation.data.email,
        cpf: validation.data.cpf,
        password: validation.data.password,
      };
      if (editingId === null) {
        await api.post("/users", payload);
      } else {
        await api.put(`/users/${editingId}`, payload);
      }

      setSuccess("Usuário salvo com sucesso.");
      resetForm();
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível salvar o usuário."));
    }
  }

  async function handleDelete(record: Usuario) {
    if (!window.confirm(`Deseja excluir o usuário ${record.name}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/users/${record.id}`);
      setSuccess("Usuário excluído com sucesso.");
      if (editingId === record.id) {
        resetForm();
      }
      if (listingPage.isListing) await reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível excluir o usuário."));
    }
  }

  return (
    <AdminPageLayout title="Usuários" userName={userName} activePath="/usuarios">
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
                name: record.name,
                email: record.email,
                cpf: record.cpf,
                password: "",
                confirmarSenha: "",
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
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Usuário" : "Edição de Usuário"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="usuario-nome">Nome</label>
                <input
                  className="form-control"
                  id="usuario-nome"
                  maxLength={150}
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="usuario-email">E-mail</label>
                <input
                  className="form-control"
                  id="usuario-email"
                  type="email"
                  maxLength={150}
                  required
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="usuario-cpf">CPF (11 dígitos)</label>
                <input
                  className="form-control"
                  id="usuario-cpf"
                  inputMode="numeric"
                  maxLength={11}
                  required
                  value={form.cpf}
                  onChange={(event) => setForm({ ...form, cpf: event.target.value.replace(/\D/g, "").slice(0, 11) })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="usuario-senha">Senha</label>
                <input
                  className="form-control"
                  id="usuario-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                {editingId !== null && <small className="form-text">Informe uma nova senha para salvar a edição.</small>}
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="usuario-confirmar-senha">Confirmar senha</label>
                <input
                  className="form-control"
                  id="usuario-confirmar-senha"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={form.confirmarSenha}
                  onChange={(event) => setForm({ ...form, confirmarSenha: event.target.value })}
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

export default UsuarioPage;