import { useEffect, useState } from "react";
import { api } from "../api/axios";
import AdminPageLayout from "../components/adminPageLayout";
import { getApiErrorMessage } from "../utils/apiError";

type DashboardData = {
  periodStart: string;
  periodEnd: string;
  appointmentCount: number;
  totalReceived: number;
  mostPerformedProcedure: {
    id: number;
    name: string;
    appointmentCount: number;
  } | null;
  topProfessional: {
    id: number;
    name: string;
    appointmentCount: number;
  } | null;
};

function DashboardPage({ userName }: { userName: string }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.get<DashboardData>("/dashboard")
      .then((response) => {
        if (active) {
          setDashboard(response.data);
        }
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(getApiErrorMessage(requestError, "Não foi possível carregar o dashboard."));
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const period = dashboard
    ? `${new Date(dashboard.periodStart).toLocaleDateString("pt-BR")} a ${new Date(dashboard.periodEnd).toLocaleDateString("pt-BR")}`
    : "Últimos 30 dias";

  return (
    <AdminPageLayout title="Dashboard" userName={userName} activePath="/home">
      <div className="mb-4">
        <p className="text-secondary mb-0">Indicadores de atendimentos de {period}.</p>
      </div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {isLoading ? (
        <p className="text-center text-secondary p-4" role="status">Carregando indicadores...</p>
      ) : dashboard && (
        <>
        {dashboard.appointmentCount === 0 && (
          <div className="alert alert-info" role="status">
            Nenhum atendimento foi registrado nos últimos 30 dias. Os indicadores abaixo mostram os valores do período.
          </div>
        )}
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <section className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h6 text-secondary">Procedimento mais realizado</h2>
                <p className="h4 mb-1">{dashboard.mostPerformedProcedure?.name ?? "—"}</p>
                <p className="mb-0 text-secondary">
                  {dashboard.mostPerformedProcedure
                    ? `${dashboard.mostPerformedProcedure.appointmentCount} realizações`
                    : "Nenhum procedimento realizado"}
                </p>
              </div>
            </section>
          </div>
          <div className="col-12 col-md-4">
            <section className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h6 text-secondary">Profissional com mais atendimentos</h2>
                <p className="h4 mb-1">{dashboard.topProfessional?.name ?? "—"}</p>
                <p className="mb-0 text-secondary">
                  {dashboard.topProfessional
                    ? `${dashboard.topProfessional.appointmentCount} atendimentos`
                    : "Nenhum atendimento realizado"}
                </p>
              </div>
            </section>
          </div>
          <div className="col-12 col-md-4">
            <section className="card shadow-sm h-100">
              <div className="card-body">
                <h2 className="h6 text-secondary">Total recebido</h2>
                <p className="h4 mb-1">
                  {dashboard.totalReceived.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                <p className="mb-0 text-secondary">
                  {dashboard.appointmentCount} atendimentos realizados
                </p>
              </div>
            </section>
          </div>
        </div>
        </>
      )}
    </AdminPageLayout>
  );
}

export default DashboardPage;
