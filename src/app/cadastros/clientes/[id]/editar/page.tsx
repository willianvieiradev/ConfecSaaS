import { Suspense } from "react";
import EditarClienteClient from "./EditarClienteClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <EditarClienteClient params={params} />
    </Suspense>
  );
}