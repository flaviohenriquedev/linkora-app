/** URL da rota que redireciona para o arquivo no Storage (conteúdo publicado). */
export function publicFileRedirectUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  return `/api/public/files/${fileId}`;
}
