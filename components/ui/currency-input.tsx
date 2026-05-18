"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFromCents(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  /** Valor em reais (ex.: 12.34). null/undefined = campo vazio */
  value: number | null | undefined;
  /** Recebe o valor em reais (sempre ≥ 0). Vazio devolve 0. */
  onChange: (value: number) => void;
  /** Esconde o prefixo R$ */
  hideSymbol?: boolean;
}

/**
 * Input formatado em Reais. O usuário digita só números e o componente
 * monta automaticamente "R$ 1.234,56" (sempre 2 casas, sem precisar
 * digitar vírgula).
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    { value, onChange, className, placeholder = "0,00", hideSymbol, disabled, ...props },
    ref
  ) {
    const safeValue = Number.isFinite(value as number) ? (value as number) : 0;
    const cents = Math.round(safeValue * 100);
    // Quando value é null/undefined E é 0, mostramos vazio (usa placeholder).
    const display =
      value == null && cents === 0 ? "" : formatFromCents(Math.max(cents, 0));

    return (
      <div className="relative">
        {!hideSymbol && (
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
              disabled && "opacity-50"
            )}
          >
            R$
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-sm text-right tabular-nums ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            hideSymbol ? "px-3" : "pl-10 pr-3",
            className
          )}
          value={display}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, "");
            const newCents = onlyDigits === "" ? 0 : parseInt(onlyDigits, 10);
            onChange(newCents / 100);
          }}
          onFocus={(e) => {
            // Seleciona tudo para facilitar substituição
            requestAnimationFrame(() => {
              e.target.select();
            });
          }}
          {...props}
        />
      </div>
    );
  }
);
