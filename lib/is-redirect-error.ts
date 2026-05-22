/**
 * Server actions que chamam `redirect()` lançam um erro especial cujo
 * `digest` começa com "NEXT_REDIRECT" (e/ou `message === "NEXT_REDIRECT"`).
 * Esse "erro" NÃO é um erro de verdade — é o jeito do Next.js sinalizar
 * que a navegação precisa acontecer. Se você capturar em try/catch e
 * exibir como erro, vai aparecer "Erro ao ... NEXT_REDIRECT" no toast,
 * mas o redirect AINDA assim acontece — só que com má UX.
 *
 * Use sempre que houver `try/catch` em volta de uma action que possa
 * redirecionar (createX, deleteX que termina com redirect, etc.):
 *
 *   try {
 *     await createSomething(...);
 *   } catch (e) {
 *     if (isRedirectError(e)) throw e;
 *     toast({ ... });
 *   }
 */
export function isRedirectError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as { message?: unknown; digest?: unknown };
  if (typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
    return true;
  }
  if (err.message === "NEXT_REDIRECT") return true;
  return false;
}
