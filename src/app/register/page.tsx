import type { Metadata } from "next";
import { AuthSplitPage } from "@/components/login/AuthSplitPage";
import { RegisterFormPanel } from "@/components/login/RegisterFormPanel";

export const metadata: Metadata = {
  title: "Cadastrar — LINKORA",
  description: "Crie sua conta Linkora.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const initialRole = sp.role === "provider" ? "provider" : "business";
  return (
    <AuthSplitPage>
      <RegisterFormPanel initialRole={initialRole} />
    </AuthSplitPage>
  );
}
