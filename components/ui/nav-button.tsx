"use client";

import { forwardRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";

export interface NavButtonProps extends Omit<ButtonProps, "asChild"> {
  /** Rota de destino. Usa router.push com useTransition para mostrar loader full-screen */
  href: string;
  /** Texto opcional do loader durante a navegação */
  loaderLabel?: string;
}

/**
 * Botão de navegação com loader global na hora do clique.
 * Diferente do <Button asChild><Link/>, este garante que o loader 🐶 apareça
 * IMEDIATAMENTE entre o clique e a renderização da próxima rota.
 */
export const NavButton = forwardRef<HTMLButtonElement, NavButtonProps>(
  function NavButton(
    { href, children, onClick, disabled, loaderLabel, ...props },
    ref
  ) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();

    return (
      <>
        <Button
          ref={ref}
          {...props}
          disabled={disabled || pending}
          onClick={(e) => {
            if (onClick) onClick(e);
            if (e.defaultPrevented) return;
            startTransition(() => router.push(href));
          }}
        >
          {children}
        </Button>
        {pending && <PageLoader label={loaderLabel} />}
      </>
    );
  }
);
