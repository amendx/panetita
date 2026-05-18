import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-lg">
            🐶
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Panetita</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panelinha da Tita</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
