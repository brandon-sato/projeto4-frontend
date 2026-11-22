import Swal from "sweetalert2";

export type SweetAlertMessageType = "success" | "error" | "warning" | "info";

export function showSweetAlertMessage(
  message: string,
  type: SweetAlertMessageType = "info",
  title?: string,
) {
  return Swal.fire({
    title: title ?? (type === "success" ? "Sucesso" : type === "error" ? "Erro" : "Aviso"),
    text: message,
    icon: type,
  });
}
