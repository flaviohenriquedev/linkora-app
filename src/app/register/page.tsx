import type { Metadata } from "next";
import { AuthSplitPage } from "@/components/login/AuthSplitPage";
import { RegisterFormPanel } from "@/components/login/RegisterFormPanel";

export const metadata: Metadata = {
  title: "Cadastrar — LINKORA",
  description: "Crie sua conta Linkora.",
};

export default function RegisterPage() {
  return (
    <AuthSplitPage>
      <RegisterFormPanel />
    </AuthSplitPage>
  );
}
