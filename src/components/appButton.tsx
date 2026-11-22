import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  | "primary"
  | "success"
  | "link"
  | "outline-primary"
  | "outline-secondary"
  | "outline-danger"
  | "outline-light";

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: "sm";
  className?: string;
};

type AppButtonProps = ButtonBaseProps
  & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>;

function getButtonClassName(
  variant?: ButtonVariant,
  size?: "sm",
  className?: string,
) {
  return [
    variant && "btn",
    size && variant && `btn-${size}`,
    variant && `btn-${variant}`,
    className,
  ].filter(Boolean).join(" ");
}

function AppButton({
  variant,
  size,
  className,
  type = "button",
  ...buttonProps
}: AppButtonProps) {
  const buttonClassName = getButtonClassName(variant, size, className);
  return <button {...buttonProps} type={type} className={buttonClassName} />;
}

export default AppButton;
