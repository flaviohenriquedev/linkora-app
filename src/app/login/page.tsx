import { AuthSplitPage } from "@/components/login/AuthSplitPage";
import { LoginFormPanel } from "@/components/login/LoginFormPanel";

export default function LoginPage() {
  return (
    <AuthSplitPage>
      <LoginFormPanel />
    </AuthSplitPage>
  );
}
