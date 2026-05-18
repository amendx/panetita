import { cn } from "@/lib/utils";

interface PageLoaderProps {
  label?: string;
  /** Cobre só o pai relativo em vez da tela inteira */
  inline?: boolean;
}

/**
 * Loader em tela cheia com o cachorrinho da Tita pulando.
 * Por padrão é fixed (cobre a tela). Use `inline` para ficar dentro de um container.
 */
export function PageLoader({ label = "Carregando...", inline = false }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm",
        inline ? "absolute inset-0" : "fixed inset-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="dog-bounce flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-5xl text-primary-foreground shadow-xl select-none">
            🐶
          </div>
          {/* sombrinha que respira no chão */}
          <div className="dog-shadow mx-auto mt-2 h-1.5 w-12 rounded-full bg-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
