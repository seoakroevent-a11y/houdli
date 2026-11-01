import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-sm text-white/50">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  );
}
