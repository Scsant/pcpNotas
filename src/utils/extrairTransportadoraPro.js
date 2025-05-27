import { getDocument } from "pdfjs-dist";

export async function extrairTransportadoraPro(pdfFile) {
  try {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async (e) => {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await getDocument({ data: typedArray }).promise;

        let fullText = "";

        const totalPages = pdf.numPages;
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const text = textContent.items.map(item => item.str).join(" ");
          fullText += text + " "; // Junta tudo num textão
        }

        // 🔥 Normaliza o texto para evitar erros de acento/capitalização
        const textoNormalizado = fullText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 🧠 Mapear transportadoras
        const transportadoras = [
          { nome: "EXPRESSO NEPOMUCENO SA", chave: "expresso nepomuceno" },
          { nome: "PLACIDOS TRANSP RODOVIARIO LTDA", chave: "placidos transp rodoviario" },
          { nome: "Grupo CargoPolo", chave: "grupo cargopolo" },
          { nome: "EN", chave: "en" },
          { nome: "Garbuio", chave: "garbuio" },
          { nome: "JSL", chave: "jsl" },
          { nome: "Serranalog", chave: "serranalog" },
          { nome: "VDA", chave: "vda" },
        ];

        const encontrada = transportadoras.find(transp => textoNormalizado.includes(transp.chave));

        if (encontrada) {
          resolve(encontrada.nome);
        } else {
          resolve("Transportadora Não Encontrada");
        }
      };

      fileReader.onerror = (error) => reject(error);
      fileReader.readAsArrayBuffer(pdfFile);
    });
  } catch (error) {
    console.error("Erro Pro ao extrair transportadora:", error);
    return "Erro Pro na leitura";
  }
}
