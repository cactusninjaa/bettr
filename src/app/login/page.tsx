import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Coin } from "@/components/Coin";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/");

  const target = callbackUrl ?? "/";
  const hasGoogle = !!process.env.AUTH_GOOGLE_ID;
  const hasGithub = !!process.env.AUTH_GITHUB_ID;

  return (
    <div className="flex-1 grid place-items-center px-6 py-16">
      <div className="card w-full max-w-sm p-8 flex flex-col items-center gap-6">
        <Coin size={64} />
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tight">Bienvenue sur Bettr</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Connecte-toi pour rejoindre tes groupes et placer tes pronostics.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          {hasGoogle && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: target });
              }}
            >
              <button type="submit" className="btn-primary w-full">
                Continuer avec Google
              </button>
            </form>
          )}
          {hasGithub && (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: target });
              }}
            >
              <button type="submit" className="btn-outline w-full">
                Continuer avec GitHub
              </button>
            </form>
          )}
          {!hasGoogle && !hasGithub && (
            <div className="text-xs text-[var(--danger)] text-center">
              Aucun provider configuré. Définis AUTH_GOOGLE_ID / AUTH_GITHUB_ID dans
              <code className="font-mono"> .env</code>.
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--muted)] text-center">
          Argent fictif. Aucun pari réel. POC interne.
        </p>
      </div>
    </div>
  );
}
