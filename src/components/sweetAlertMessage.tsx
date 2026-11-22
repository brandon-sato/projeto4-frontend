import Swal from "sweetalert2";

export type SweetAlertMessageType = "success" | "error" | "warning" | "info";

let unauthorizedAlert: ReturnType<typeof Swal.fire> | null = null;

export function showSweetAlertMessage(
  message: string,
  type: SweetAlertMessageType = "info",
  title?: string,
) {
  if (unauthorizedAlert) {
    return unauthorizedAlert;
  }

  return Swal.fire({
    title: title ?? (type === "success" ? "Sucesso" : type === "error" ? "Erro" : "Aviso"),
    text: message,
    icon: type,
  });
}

export function showUnauthorizedAlert() {
  if (!unauthorizedAlert) {
    unauthorizedAlert = Swal.fire({
      title: "Acesso não autorizado",
      text: "Sua sessão é inválida ou expirou. Faça login novamente.",
      icon: "error",
      confirmButtonText: "OK",
    }).finally(() => {
      unauthorizedAlert = null;
    });
  }

  return unauthorizedAlert;
}
