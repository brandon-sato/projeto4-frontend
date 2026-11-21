import type { ReactNode } from "react";
import Navbar from "./navbar";

type AdminPageLayoutProps = {
  title: string;
  userName: string;
  activePath: string;
  children: ReactNode;
};

function AdminPageLayout({
  title,
  userName,
  activePath,
  children,
}: AdminPageLayoutProps) {
  return (
    <div className="admin-dashboard">
      <Navbar userName={userName} activePath={activePath} />
      <main className="container-fluid admin-content">
        <div className="row mb-4">
          <div className="col">
            <h1>Gerenciar {title}</h1>
            <p>Cadastre, consulte, edite ou remova registros.</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

export default AdminPageLayout;
