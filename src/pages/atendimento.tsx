import { useState, type FormEvent } from "react";
import { api } from "../api/axion";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { formatCurrency, formatDateTime, getApiErrorMessage, toDateTimeInput } from "./crudUtils";

type Atendimento = {
  id: number;
  id_cliente: number;
  id_profissional: number;
  data_atendimento: string;
  valor: number | string;
};
type Cliente = { id: number; nome: string };
type Profissional = { id: number; nome: string };
type Procedimento = { id: number; nome: string };
type AtendimentoProcedimento = {
  id_atendimento: number;
  procedimento_id: number;
};
type AtendimentoForm = {
  id_cliente: string;
  id_profissional: string;
  data_atendimento: string;
  valor: string;
};

const emptyForm: AtendimentoForm = {
  id_cliente: "",
  id_profissional: "",
  data_atendimento: "",
  valor: "",
};

function AtendimentoPage({ userName }: { userName: string }) {
  const appointments = useRecords<Atendimento>("/appointments", false);
  const listingPage = useListingPage("/atendimentos", appointments.reload);
  const clients = useRecords<Cliente>("/clients");
  const professionals = useRecords<Profissional>("/professionals");
  const procedures = useRecords<Procedimento>("/procedures");
  const links = useRecords<AtendimentoProcedimento>("/appointment-procedures");
  const [form, setForm] = useState<AtendimentoForm>(emptyForm);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const columns = [
    { label: "ID", render: (record: Atendimento) => record.id },
    {
      label: "Cliente",
      render: (record: Atendimento) =>
        clients.records.find((client) => client.id === record.id_cliente)?.nome ?? "—",
    },
    {
      label: "Profissional",
      render: (record: Atendimento) =>
        professionals.records.find((professional) => professional.id === record.id_profissional)?.nome ?? "—",
    },
    {
      label: "Procedimentos",
      render: (record: Atendimento) => {
        const names = links.records
          .filter((link) => link.id_atendimento === record.id)
          .map((link) => procedures.records.find((procedure) => procedure.id === link.procedimento_id)?.nome)
          .filter((name): name is string => Boolean(name));
        return names.length > 0 ? names.join(", ") : "—";
      },
    },
    { label: "Data e horário", render: (record: Atendimento) => formatDateTime(record.data_atendimento) },
    { label: "Valor", render: (record: Atendimento) => formatCurrency(record.valor) },
  ];

  function resetForm() {
    setForm(emptyForm);
    setSelectedProcedures([]);
    setEditingId(null);
    setError("");
  }

  async function synchronizeProcedures(appointmentId: number) {
    const desiredIds = new Set(selectedProcedures.map(Number));
    const currentIds = links.records
      .filter((link) => link.id_atendimento === appointmentId)
      .map((link) => link.procedimento_id);

    for (const procedureId of currentIds) {
      if (!desiredIds.has(procedureId)) {
        await api.delete(`/appointment-procedures/${appointmentId}/${procedureId}`);
      }
    }

    for (const procedureId of desiredIds) {
      if (!currentIds.includes(procedureId)) {
        await api.post("/appointment-procedures", {
          id_atendimento: appointmentId,
          procedimento_id: procedureId,
        });
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    let savedId = editingId;
    let appointmentSaved = false;

    try {
      const payload = {
        id_cliente: Number(form.id_cliente),
        id_profissional: Number(form.id_profissional),
        data_atendimento: new Date(form.data_atendimento).toISOString(),
        valor: Number(form.valor),
      };
      const response = editingId === null
        ? await api.post<Atendimento>("/appointments", payload)
        : await api.put<Atendimento>(`/appointments/${editingId}`, payload);
      savedId = editingId ?? response.data.id;
      appointmentSaved = true;

      await synchronizeProcedures(savedId);
      setSuccess("Atendimento salvo com sucesso.");
      resetForm();
      await links.reload();
      if (listingPage.isListing) await appointments.reload();
    } catch (requestError: unknown) {
      setError(
        appointmentSaved
          ? `O atendimento foi salvo, mas não foi possível atualizar os procedimentos associados. ${getApiErrorMessage(requestError, "Tente novamente.")}`
          : getApiErrorMessage(requestError, "Não foi possível salvar o atendimento."),
      );
      if (appointmentSaved && savedId !== null) {
        setEditingId(savedId);
        await links.reload();
        if (listingPage.isListing) await appointments.reload();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(record: Atendimento) {
    if (!window.confirm(`Deseja excluir o atendimento #${record.id}?`)) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await api.delete(`/appointments/${record.id}`);
      setSuccess("Atendimento excluído com sucesso.");
      if (editingId === record.id) {
        resetForm();
      }
      await links.reload();
      if (listingPage.isListing) await appointments.reload();
    } catch (requestError: unknown) {
      setError(getApiErrorMessage(requestError, "Não foi possível excluir o atendimento."));
    }
  }

  function beginEdit(record: Atendimento) {
    setForm({
      id_cliente: String(record.id_cliente),
      id_profissional: String(record.id_profissional),
      data_atendimento: toDateTimeInput(record.data_atendimento),
      valor: String(record.valor),
    });
    setSelectedProcedures(
      links.records
        .filter((link) => link.id_atendimento === record.id)
        .map((link) => String(link.procedimento_id)),
    );
    setEditingId(record.id);
    setError("");
    setSuccess("");
    listingPage.showForm();
  }

  return (
    <AdminPageLayout title="Atendimentos" userName={userName} activePath="/atendimentos">
      {error && <div className="alert alert-danger">{error}</div>}
      {[appointments, clients, professionals, procedures, links]
        .filter((resource) => resource.loadError)
        .map((resource, index) => <div className="alert alert-danger" key={index}>{resource.loadError}</div>)}
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
            records={appointments.records}
            isLoading={appointments.isLoading}
            onEdit={beginEdit}
            onDelete={(record) => void handleDelete(record)}
          />
        </>
      ) : (
      <section className="card shadow-sm admin-panel mb-4">
        <div className="card-header">
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Atendimento" : "Edição de Atendimento"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="atendimento-cliente">Cliente</label>
                <select
                  className="form-select"
                  id="atendimento-cliente"
                  required
                  value={form.id_cliente}
                  onChange={(event) => setForm({ ...form, id_cliente: event.target.value })}
                >
                  <option value="">Selecione</option>
                  {clients.records.map((client) => (
                    <option key={client.id} value={client.id}>{client.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="atendimento-profissional">Profissional</label>
                <select
                  className="form-select"
                  id="atendimento-profissional"
                  required
                  value={form.id_profissional}
                  onChange={(event) => setForm({ ...form, id_profissional: event.target.value })}
                >
                  <option value="">Selecione</option>
                  {professionals.records.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="atendimento-data">Data e horário</label>
                <input
                  className="form-control"
                  id="atendimento-data"
                  type="datetime-local"
                  required
                  value={form.data_atendimento}
                  onChange={(event) => setForm({ ...form, data_atendimento: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="atendimento-valor">Valor (R$)</label>
                <input
                  className="form-control"
                  id="atendimento-valor"
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  value={form.valor}
                  onChange={(event) => setForm({ ...form, valor: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Procedimentos</label>
                <div className="admin-relation-options d-flex flex-wrap gap-3 p-3 border rounded">
                  {procedures.records.length > 0 ? procedures.records.map((procedure) => (
                    <label className="form-check d-flex align-items-center gap-2" key={procedure.id}>
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        checked={selectedProcedures.includes(String(procedure.id))}
                        onChange={(event) => setSelectedProcedures((current) =>
                          event.target.checked
                            ? [...current, String(procedure.id)]
                            : current.filter((id) => id !== String(procedure.id)),
                        )}
                      />
                      <span>{procedure.nome}</span>
                    </label>
                  )) : <span className="text-secondary">Nenhum procedimento disponível.</span>}
                </div>
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
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar registro"}
              </button>
            </div>
          </form>
        </div>
      </section>
      )}
    </AdminPageLayout>
  );
}

export default AtendimentoPage;
