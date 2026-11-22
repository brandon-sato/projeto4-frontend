import { useState, type FormEvent } from "react";
import { api } from "../api/axios";
import AdminPageLayout from "../components/adminPageLayout";
import RecordTable from "../components/recordTable";
import useListingPage from "../hooks/useListingPage";
import useRecords from "../hooks/useRecords";
import { procedimentoSchema } from "../schemas/schemas";
import { getApiErrorMessage } from "../utils/apiError";
import { formatCurrency } from "../utils/format";
import { confirmSweetAlert } from "../components/sweetAlertConfirm";
import { showSweetAlertMessage } from "../components/sweetAlertMessage";

type Categoria = { id: number; nome: string };
type Profissional = { id: number; nome: string };
type Procedimento = {
  id: number;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number;
  preco: number | string;
  id_categoria: number;
};
type ProcedimentoProfissional = {
  id_procedimento: number;
  id_profissional: number;
};
type ProcedimentoForm = {
  nome: string;
  descricao: string;
  duracaoMinutos: string;
  preco: string;
  id_categoria: string;
};

const emptyForm: ProcedimentoForm = {
  nome: "",
  descricao: "",
  duracaoMinutos: "",
  preco: "",
  id_categoria: "",
};

function ProcedimentoPage({ userName }: { userName: string }) {
  const procedures = useRecords<Procedimento>("/procedures", false);
  const listingPage = useListingPage("/procedimentos", procedures.reload);
  const categories = useRecords<Categoria>("/categories");
  const professionals = useRecords<Profissional>("/professionals");
  const links = useRecords<ProcedimentoProfissional>("/procedure-professionals");
  const [form, setForm] = useState<ProcedimentoForm>(emptyForm);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const columns = [
    { label: "ID", render: (record: Procedimento) => record.id },
    { label: "Nome", render: (record: Procedimento) => record.nome },
    {
      label: "Categoria",
      render: (record: Procedimento) =>
        categories.records.find((category) => category.id === record.id_categoria)?.nome ?? "—",
    },
    { label: "Duração", render: (record: Procedimento) => `${record.duracaoMinutos} min` },
    { label: "Preço", render: (record: Procedimento) => formatCurrency(record.preco) },
  ];

  function resetForm() {
    setForm(emptyForm);
    setSelectedProfessionals([]);
    setEditingId(null);
  }

  async function synchronizeProfessionals(procedureId: number) {
    const desiredIds = new Set(selectedProfessionals.map(Number));
    const currentIds = links.records
      .filter((link) => link.id_procedimento === procedureId)
      .map((link) => link.id_profissional);

    for (const professionalId of currentIds) {
      if (!desiredIds.has(professionalId)) {
        await api.delete(`/procedure-professionals/${procedureId}/${professionalId}`);
      }
    }

    for (const professionalId of desiredIds) {
      if (!currentIds.includes(professionalId)) {
        await api.post("/procedure-professionals", {
          id_procedimento: procedureId,
          id_profissional: professionalId,
        });
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    let savedId = editingId;
    let procedureSaved = false;

    const validation = procedimentoSchema.safeParse(form);
    if (!validation.success) {
      await showSweetAlertMessage(validation.error.issues[0]?.message ?? "Dados inválidos.", "error");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        nome: validation.data.nome,
        descricao: validation.data.descricao || null,
        duracaoMinutos: validation.data.duracaoMinutos,
        preco: validation.data.preco,
        id_categoria: validation.data.id_categoria,
      };
      const response = editingId === null
        ? await api.post<Procedimento>("/procedures", payload)
        : await api.put<Procedimento>(`/procedures/${editingId}`, payload);
      savedId = editingId ?? response.data.id;
      procedureSaved = true;

      await synchronizeProfessionals(savedId);
      await showSweetAlertMessage("Procedimento salvo com sucesso.", "success");
      resetForm();
      await links.reload();
      if (listingPage.isListing) await procedures.reload();
    } catch (requestError: unknown) {
      await showSweetAlertMessage(
        procedureSaved
          ? `O procedimento foi salvo, mas não foi possível atualizar os profissionais associados. ${getApiErrorMessage(requestError, "Tente novamente.")}`
          : getApiErrorMessage(requestError, "Não foi possível salvar o procedimento."),
        "error",
      );
      if (procedureSaved && savedId !== null) {
        setEditingId(savedId);
        await links.reload();
        if (listingPage.isListing) await procedures.reload();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(record: Procedimento) {
    if (!await confirmSweetAlert("Excluir procedimento", `Deseja excluir o procedimento ${record.nome}?`)) {
      return;
    }

    try {
      await api.delete(`/procedures/${record.id}`);
      await showSweetAlertMessage("Procedimento excluído com sucesso.", "success");
      if (editingId === record.id) {
        resetForm();
      }
      await links.reload();
      if (listingPage.isListing) await procedures.reload();
    } catch (requestError: unknown) {
      await showSweetAlertMessage(
        getApiErrorMessage(requestError, "Não foi possível excluir o procedimento."),
        "error",
      );
    }
  }

  function beginEdit(record: Procedimento) {
    setForm({
      nome: record.nome,
      descricao: record.descricao ?? "",
      duracaoMinutos: String(record.duracaoMinutos),
      preco: String(record.preco),
      id_categoria: String(record.id_categoria),
    });
    setSelectedProfessionals(
      links.records
        .filter((link) => link.id_procedimento === record.id)
        .map((link) => String(link.id_profissional)),
    );
    setEditingId(record.id);
    listingPage.showForm();
  }

  return (
    <AdminPageLayout title="Procedimentos" userName={userName} activePath="/procedimentos">

      {listingPage.isListing ? (
        <>
          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-primary" onClick={listingPage.showForm}>
              Voltar ao cadastro
            </button>
          </div>
          <RecordTable
            columns={columns}
            records={procedures.records}
            isLoading={procedures.isLoading}
            onEdit={beginEdit}
            onDelete={(record) => void handleDelete(record)}
          />
        </>
      ) : (
      <section className="card shadow-sm admin-panel mb-4">
        <div className="card-header">
          <h2 className="h5 mb-0">{editingId === null ? "Cadastro de Procedimento" : "Edição de Procedimento"}</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-8">
                <label className="form-label" htmlFor="procedimento-nome">Nome</label>
                <input
                  className="form-control"
                  id="procedimento-nome"
                  maxLength={150}
                  required
                  value={form.nome}
                  onChange={(event) => setForm({ ...form, nome: event.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label" htmlFor="procedimento-descricao">Descrição</label>
                <textarea
                  className="form-control"
                  id="procedimento-descricao"
                  rows={3}
                  maxLength={500}
                  value={form.descricao}
                  onChange={(event) => setForm({ ...form, descricao: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="procedimento-duracao">Duração (minutos)</label>
                <input
                  className="form-control"
                  id="procedimento-duracao"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={form.duracaoMinutos}
                  onChange={(event) => setForm({ ...form, duracaoMinutos: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="procedimento-preco">Preço (R$)</label>
                <input
                  className="form-control"
                  id="procedimento-preco"
                  type="number"
                  min={0.01}
                  step={0.01}
                  required
                  value={form.preco}
                  onChange={(event) => setForm({ ...form, preco: event.target.value })}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" htmlFor="procedimento-categoria">Categoria</label>
                <select
                  className="form-select"
                  id="procedimento-categoria"
                  required
                  value={form.id_categoria}
                  onChange={(event) => setForm({ ...form, id_categoria: event.target.value })}
                >
                  <option value="">Selecione</option>
                  {categories.records.map((category) => (
                    <option key={category.id} value={category.id}>{category.nome}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Profissionais que realizam o procedimento</label>
                <div className="admin-relation-options d-flex flex-wrap gap-3 p-3 border rounded">
                  {professionals.records.length > 0 ? professionals.records.map((professional) => (
                    <label className="form-check d-flex align-items-center gap-2" key={professional.id}>
                      <input
                        className="form-check-input m-0"
                        type="checkbox"
                        checked={selectedProfessionals.includes(String(professional.id))}
                        onChange={(event) => setSelectedProfessionals((current) =>
                          event.target.checked
                            ? [...current, String(professional.id)]
                            : current.filter((id) => id !== String(professional.id)),
                        )}
                      />
                      <span>{professional.nome}</span>
                    </label>
                  )) : <span className="text-secondary">Nenhum profissional disponível.</span>}
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

export default ProcedimentoPage;
