import PedidosQueue from "./PedidosQueue";

function PageContainer() {
  const perfil = JSON.parse(localStorage.getItem("perfil") || "null");

  return (
    <main className="mx-auto max-w-7xl">
      <PedidosQueue
        perfil={perfil}
        title="PCP Notas"
        description="Fila central de solicitações feitas pelas transportadoras. O objetivo aqui é enxergar a demanda do dia, atender os pedidos por ordem antiga e manter o fechamento sob controle."
        allowAttend={perfil?.role === "admin"}
      />
    </main>
  );
}

export default PageContainer;
