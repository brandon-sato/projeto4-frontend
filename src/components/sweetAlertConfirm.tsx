import Swal from "sweetalert2";

export async function confirmSweetAlert(
  title: string,
  text: string,
): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Confirmar",
    cancelButtonText: "Cancelar",
    reverseButtons: true,
  });

  return result.isConfirmed;
}
