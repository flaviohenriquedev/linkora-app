import {AuthSplitPage} from "@/components/login/AuthSplitPage";
import {LoginFormPanel} from "@/components/login/LoginFormPanel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; needOwnerRegister?: string; inactive?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/";
  const needOwnerRegister = sp.needOwnerRegister === "1";
  const inactive = sp.inactive === "1";
  return (
    <AuthSplitPage>
      <LoginFormPanel nextPath={next} initialNeedOwnerRegister={needOwnerRegister} initialInactive={inactive} />
    </AuthSplitPage>
  );
}
