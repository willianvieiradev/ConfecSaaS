import { Suspense } from "react";
import EditarFornecedorClient from "./EditarFornecedorClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditarFornecedorClient params={params} />
    </Suspense>
  );
}
