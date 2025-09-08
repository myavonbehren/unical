import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/app/shared/env-var-warning";
import { AuthButton } from "@/app/auth/components/auth-button";
import { Hero } from "@/app/shared/hero";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Header from "@/app/shared/layout/Header";
import Footer from "@/app/shared/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          <div className="flex-1 flex flex-col gap-6 px-4">
            <h2 className="font-medium text-xl mb-4">Next steps</h2>
            {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
