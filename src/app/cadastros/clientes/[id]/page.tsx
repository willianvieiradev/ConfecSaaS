import { Suspense } from "react";
import ClienteDetalhesClient from "./ClienteDetalhesClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ClienteDetalhesClient params={params} />
    </Suspense>
  );
}