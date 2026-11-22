import { z } from "zod";

export function isCpfValid(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = [...cpf].map(Number);
  const calculateDigit = (length: number): number => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === digits[9] && calculateDigit(10) === digits[10];
}

export const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, "Informe um CPF com 11 dígitos.")
  .refine(isCpfValid, "Informe um CPF válido.");

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  cpf: cpfSchema,
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  passwordConfirmation: z.string(),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "A confirmação deve ser igual à senha digitada.",
  path: ["passwordConfirmation"],
});

export const categoriaSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da categoria."),
  descricao: z.string().trim().max(500, "A descrição deve ter no máximo 500 caracteres."),
});

export const clienteSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do cliente."),
  dt_nasc: z.string().min(1, "Informe a data de nascimento."),
  sexo: z.enum(["F", "M", "O"], "Selecione o sexo."),
  cpf: cpfSchema,
  contato: z.string().refine(
    (value) => value === "" || /^\d{10,11}$/.test(value),
    "Informe um contato com DDD e número.",
  ),
});

export const profissionalSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do profissional."),
  dt_nasc: z.string().min(1, "Informe a data de nascimento."),
  sexo: z.enum(["F", "M", "O"], "Selecione o sexo."),
  contato: z.string().trim().optional(),
  especialidade: z.string().trim().optional(),
});

export const usuarioSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("Informe um e-mail válido."),
  cpf: cpfSchema,
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
  confirmarSenha: z.string(),
}).refine((data) => data.password === data.confirmarSenha, {
  message: "A senha e a confirmação devem ser iguais.",
  path: ["confirmarSenha"],
});

export const procedimentoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do procedimento."),
  descricao: z.string().trim().max(500, "A descrição deve ter no máximo 500 caracteres."),
  duracaoMinutos: z.coerce.number().int("A duração deve ser um número inteiro.").positive("A duração deve ser maior que zero."),
  preco: z.coerce.number().positive("O preço deve ser maior que zero."),
  id_categoria: z.coerce.number().int().positive("Selecione uma categoria."),
});

export const atendimentoSchema = z.object({
  id_cliente: z.coerce.number().int().positive("Selecione um cliente."),
  id_profissional: z.coerce.number().int().positive("Selecione um profissional."),
  valor: z.coerce.number().positive("O valor deve ser maior que zero."),
});
