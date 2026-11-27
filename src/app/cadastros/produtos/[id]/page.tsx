import { Suspense } from "react";
import ProdutoDetalhesClient from "./ProdutoDetalhesClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ProdutoDetalhesClient params={params} />
    </Suspense>
  );
}
