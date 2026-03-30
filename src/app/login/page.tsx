import { AuthSplitPage } from "@/components/login/AuthSplitPage";
import { LoginFormPanel } from "@/components/login/LoginFormPanel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/";
  return (
    <AuthSplitPage>
      <LoginFormPanel nextPath={next} />
    </AuthSplitPage>
  );
}
