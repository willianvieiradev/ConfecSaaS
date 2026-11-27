import { Suspense } from "react";
import { connection } from "next/server";
import EditarContaClient from "./editar-client";

export const instant = false;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#5A3D50]">Carregando...</div>}>
      <EditarContaClient id={resolvedParams.id} />
    </Suspense>
  );
}