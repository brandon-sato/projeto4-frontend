import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "react-bootstrap";
import { api } from "../api/axios";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { atendimentoSchema } from "../schemas/schemas";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency, formatDateTime, formatDate } from "../utils/format";
import { confirmSweetAlert } from "../components/sweetAlertConfirm";
import { showSweetAlertMessage } from "../components/sweetAlertMessage";

type Atendimento = {
  id: number;
  id_cliente: number;
  id_profissional: number;
  data_atendimento: string;
  valor: number | string;
};
type Cliente = {
  id: number;
  nome: string;
  dt_nasc: string;
  cpf: string | null;
};
type Profissional = { id: number; nome: string };
type Procedimento = { id: number; nome: string; preco: number | string };
type AtendimentoProcedimento = {
  id_atendimento: number;
  procedimento_id: number;
};
type ProcedimentoProfissional = {
  id_procedimento: number;
  id_profissional: number;
};
type AtendimentoForm = {
  id_cliente: string;
  id_profissional: string;
  valor: string;
};

const emptyForm: AtendimentoForm = {
  id_cliente: "",
  id_profissional: "",
  valor: "",
};

function AtendimentoPage({ userName }: { userName: string }) {
  const appointments = useRecords<Atendimento>("/appointments", false);
  const listingPage = useListingPage("/atendimentos", appointments.reload);
  const clients = useRecords<Cliente>("/clients");
  const professionals = useRecords<Profissional>("/professionals");
  const procedures = useRecords<Procedimento>("/procedures");
  const links = useRecords<AtendimentoProcedimento>("/appointment-procedures");
  const procedureProfessionals = useRecords<ProcedimentoProfissional>("/procedure-professionals");
  const [form, setForm] = useState<AtendimentoForm>(emptyForm);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientSearchField, setClientSearchField] = useState<"nome" | "dt_nasc" | "cpf">("nome");
  const [clientSearch, setClientSearch] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [clientSearchPage, setClientSearchPage] = useState(1);
  const selectedClient = clients.records.find((client) => String(client.id) === form.id_cliente);
  const availableProcedures = procedures.records.filter((procedure) =>
    procedureProfessionals.records.some((relation) =>
      relation.id_procedimento === procedure.id
      && relation.id_profissional === Number(form.id_profissional),
    ),
  );

  function calculateProceduresValue(procedureIds: string[], professionalId: string): string {
    const total = procedures.records
      .filter((procedure) =>
        procedureIds.includes(String(procedure.id))
        && procedureProfessionals.records.some((relation) =>
          relation.id_procedimento === procedure.id
          && relation.id_profissional === Number(professionalId),
        ),
      )
      .reduce((sum, procedure) => sum + Number(procedure.preco), 0);

    return total > 0 ? total.toFixed(2) : "";
  }

  function handleProfessionalChange(professionalId: string) {
    setForm({ ...form, id_profissional: professionalId, valor: "" });
    setSelectedProcedures([]);
  }

  function handleProcedureChange(procedureId: string, checked: boolean) {
    const nextProcedures = checked
      ? [...selectedProcedures, procedureId]
      : selectedProcedures.filter((id) => id !== procedureId);

    setSelectedProcedures(nextProcedures);
    setForm({ ...form, valor: calculateProceduresValue(nextProcedures, form.id_profissional) });
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedClientSearch(clientSearch);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [clientSearch]);

  const clientSearchResults = debouncedClientSearch.trim() === ""
    ? []
    : clients.records
      .filter((client) => {
        if (clientSearchField === "nome") {
          return client.nome.toLocaleLowerCase("pt-BR")
            .includes(debouncedClientSearch.trim().toLocaleLowerCase("pt-BR"));
        }
        if (clientSearchField === "dt_nasc") {
          return client.dt_nasc.slice(0, 10).includes(debouncedClientSearch.trim());
        }
        return (client.cpf ?? "").replace(/\D/g, "").includes(debouncedClientSearch.replace(/\D/g, ""));
      });

  const clientsPerPage = 10;
  const clientSearchPageCount = Math.ceil(clientSearchResults.length / clientsPerPage);
  const paginatedClientResults = clientSearchResults.slice(
    (clientSearchPage - 1) * clientsPerPage,
    clientSearchPage * clientsPerPage,
  );

  useEffect(() => {
    setClientSearchPage(1);
  }, [debouncedClientSearch, clientSearchField]);

  useEffect(() => {
    if (clientSearchPageCount > 0 && clientSearchPage > clientSearchPageCount) {
      setClientSearchPage(clientSearchPageCount);
    }
  }, [clientSearchPage, clientSearchPageCount]);

  function openClientModal() {
    setClientSearch("");
    setDebouncedClientSearch("");
    setIsClientModalOpen(true);
  }

  function selectClient(client: Cliente) {
    setForm({ ...form, id_cliente: String(client.id) });
    setIsClientModalOpen(false);
  }
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
    setIsSubmitting(true);
    let savedId = editingId;
    let appointmentSaved = false;

    const validation = atendimentoSchema.safeParse(form);
    if (!validation.success) {
      await showSweetAlertMessage(validation.error.issues[0]?.message ?? "Dados inválidos.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        id_cliente: validation.data.id_cliente,
        id_profissional: validation.data.id_profissional,
        data_atendimento: new Date().toISOString(),
        valor: validation.data.valor,
      };
      const response = editingId === null
        ? await api.post<Atendimento>("/appointments", payload)
        : await api.put<Atendimento>(`/appointments/${editingId}`, payload);
      savedId = editingId ?? response.data.id;
      appointmentSaved = true;

      await synchronizeProcedures(savedId);
      await showSweetAlertMessage("Atendimento salvo com sucesso.", "success");
      resetForm();
      await links.reload();
      if (listingPage.isListing) await appointments.reload();
    } catch (requestError: unknown) {
      await showSweetAlertMessage(
        appointmentSaved
          ? `O atendimento foi salvo, mas não foi possível atualizar os procedimentos associados. ${getApiErrorMessage(requestError, "Tente novamente.")}`
          : getApiErrorMessage(requestError, "Não foi possível salvar o atendimento."),
        "error",
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
    if (!await confirmSweetAlert("Excluir atendimento", `Deseja excluir o atendimento #${record.id}?`)) {
      return;
    }

    try {
      await api.delete(`/appointments/${record.id}`);
      await showSweetAlertMessage("Atendimento excluído com sucesso.", "success");
      if (editingId === record.id) {
        resetForm();
      }
      await links.reload();
      if (listingPage.isListing) await appointments.reload();
    } catch (requestError: unknown) {
      await showSweetAlertMessage(
        getApiErrorMessage(requestError, "Não foi possível excluir o atendimento."),
        "error",
      );
    }
  }

  function beginEdit(record: Atendimento) {
    const procedureIds = links.records
      .filter((link) => link.id_atendimento === record.id)
      .map((link) => String(link.procedimento_id));

    setForm({
      id_cliente: String(record.id_cliente),
      id_profissional: String(record.id_profissional),
      valor: calculateProceduresValue(procedureIds, String(record.id_profissional)),
    });
    setSelectedProcedures(procedureIds);
    setEditingId(record.id);
    listingPage.showForm();
  }

  return (
    <AdminPageLayout title="Atendimentos" userName={userName} activePath="/atendimentos">

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
                <div className="input-group">
                  <input
                    className="form-control"
                    id="atendimento-cliente"
                    readOnly
                    required
                    value={selectedClient?.nome ?? ""}
                    placeholder="Nenhum cliente selecionado"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={openClientModal}
                  >
                    Selecionar
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor="atendimento-profissional">Profissional</label>
                <select
                  className="form-select"
                  id="atendimento-profissional"
                  required
                  value={form.id_profissional}
                  onChange={(event) => handleProfessionalChange(event.target.value)}
                >
                  <option value="">Selecione</option>
                  {professionals.records.map((professional) => (
                    <option key={professional.id} value={professional.id}>{professional.nome}</option>
                  ))}
                </select>
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
                  {availableProcedures.length > 0 ? availableProcedures.map((procedure) => (
                    <label className="form-check d-flex align-items-center gap-2" key={procedure.id}>
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        checked={selectedProcedures.includes(String(procedure.id))}
                        onChange={(event) =>
                          handleProcedureChange(String(procedure.id), event.target.checked)
                        }
                      />
                      <span>{procedure.nome} — {formatCurrency(procedure.preco)}</span>
                    </label>
                  )) : <span className="text-secondary">
                    {form.id_profissional
                      ? "Nenhum procedimento disponível para este profissional."
                      : "Selecione um profissional para ver os procedimentos."}
                  </span>}
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
      <Modal
        show={isClientModalOpen}
        onHide={() => setIsClientModalOpen(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Selecionar cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <fieldset className="mb-3">
            <legend className="form-label fs-6">Pesquisar por</legend>
            <div className="d-flex flex-wrap gap-3">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="cliente-pesquisa"
                  checked={clientSearchField === "nome"}
                  onChange={() => {
                    setClientSearchField("nome");
                    setClientSearch("");
                    setDebouncedClientSearch("");
                  }}
                />
                <span className="form-check-label ms-2">Nome</span>
              </label>
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="cliente-pesquisa"
                  checked={clientSearchField === "dt_nasc"}
                  onChange={() => {
                    setClientSearchField("dt_nasc");
                    setClientSearch("");
                    setDebouncedClientSearch("");
                  }}
                />
                <span className="form-check-label ms-2">Data de nascimento</span>
              </label>
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="cliente-pesquisa"
                  checked={clientSearchField === "cpf"}
                  onChange={() => {
                    setClientSearchField("cpf");
                    setClientSearch("");
                    setDebouncedClientSearch("");
                  }}
                />
                <span className="form-check-label ms-2">CPF</span>
              </label>
            </div>
          </fieldset>

          <label className="form-label" htmlFor="cliente-busca">
            {clientSearchField === "nome"
              ? "Nome do cliente"
              : clientSearchField === "dt_nasc"
                ? "Data de nascimento"
                : "CPF"}
          </label>
          <input
            className="form-control"
            id="cliente-busca"
            type={clientSearchField === "dt_nasc" ? "date" : "text"}
            inputMode={clientSearchField === "cpf" ? "numeric" : undefined}
            maxLength={clientSearchField === "cpf" ? 11 : undefined}
            value={clientSearch}
            onChange={(event) => {
              const value = clientSearchField === "cpf"
                ? event.target.value.replace(/\D/g, "").slice(0, 11)
                : event.target.value;
              setClientSearch(value);
            }}
            autoComplete="off"
          />

          {debouncedClientSearch.trim() !== "" && (
            <div className="list-group mt-2">
              {paginatedClientResults.length > 0 ? paginatedClientResults.map((client) => (
                <button
                  type="button"
                  className="list-group-item list-group-item-action"
                  key={client.id}
                  onClick={() => selectClient(client)}
                >
                  <strong>{client.nome}</strong>
                  <br />
                  <small className="text-secondary">
                    CPF: {client.cpf || "—"} | Nascimento: {formatDate(client.dt_nasc)}
                  </small>
                </button>
              )) : (
                <div className="list-group-item text-secondary">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {clientSearchPageCount > 1 && (
            <nav aria-label="Paginação dos clientes" className="me-auto">
              <ul className="pagination mb-0">
                <li className={`page-item ${clientSearchPage === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setClientSearchPage((page) => Math.max(1, page - 1))}
                    disabled={clientSearchPage === 1}
                  >
                    Anterior
                  </button>
                </li>
                {Array.from({ length: clientSearchPageCount }, (_, index) => index + 1).map((page) => (
                  <li className={`page-item ${clientSearchPage === page ? "active" : ""}`} key={page}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => setClientSearchPage(page)}
                      aria-current={clientSearchPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${clientSearchPage === clientSearchPageCount ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setClientSearchPage((page) =>
                      Math.min(clientSearchPageCount, page + 1),
                    )}
                    disabled={clientSearchPage === clientSearchPageCount}
                  >
                    Próxima
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setIsClientModalOpen(false)}
          >
            Fechar
          </button>
        </Modal.Footer>
      </Modal>
    </AdminPageLayout>
  );
}

export default AtendimentoPage;
