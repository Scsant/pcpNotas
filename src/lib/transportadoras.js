export const transportadorasConfig = [
  {
    id: 1,
    nome: "Cargo Polo",
    nomeDocumento: "CARGO POLO COMERCIO, LOGISTICA",
    logo: "/rectangle-70.png",
    titulo: "Notas Fiscais - Cargo Polo",
    route: "/painel-transportadora/1",
  },
  {
    id: 2,
    nome: "Garbuio",
    nomeDocumento: "EUCLIDES RENATO GARBUÍO TRANSPORTE",
    logo: "/rectangle-90.png",
    titulo: "Notas Fiscais - Garbuio",
    route: "/painel-transportadora/2",
  },
  {
    id: 3,
    nome: "Nepomuceno",
    nomeDocumento: "EXPRESSO NEPOMUCENO S/A",
    logo: "/rectangle-80.png",
    titulo: "Notas Fiscais - Nepomuceno",
    route: "/painel-transportadora/3",
  },
  {
    id: 4,
    nome: "TransOlsen",
    nomeDocumento: "TRANS OLSEN LTDA-SP",
    logo: "/rectangle-110.png",
    titulo: "Notas Fiscais - TransOlsen",
    route: "/painel-transportadora/4",
  },
  {
    id: 5,
    nome: "JSL",
    nomeDocumento: "JSL S.A.-MS",
    logo: "/rectangle-100.png",
    titulo: "Notas Fiscais - JSL",
    route: "/painel-transportadora/5",
  },
  {
    id: 6,
    nome: "Placidos",
    nomeDocumento: "PLACIDOS TRANSPORTES LTDA-SP",
    logo: "/rectangle-120.png",
    titulo: "Notas Fiscais - Placidos",
    route: "/painel-transportadora/6",
  },
  {
    id: 7,
    nome: "Serranalog",
    nomeDocumento: "SERRANALOG LTDA-SP",
    logo: "/rectangle-130.png",
    titulo: "Notas Fiscais - Serranalog",
    route: "/painel-transportadora/7",
  },
  {
    id: 8,
    nome: "VDA",
    nomeDocumento: "VDA LOGISTICA LTDA-SP",
    logo: "/rectangle-140.png",
    titulo: "Notas Fiscais - VDA Logística",
    route: "/painel-transportadora/8",
  },
];

export const getTransportadoraConfig = (id) =>
  transportadorasConfig.find((item) => Number(item.id) === Number(id)) || null;
