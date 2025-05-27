import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import { useNavigate } from "react-router-dom";
import GlobalHeader from "../components/GlobalHeader";


const pdfjsVersion = "3.11.174";
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

const UploadNotas = () => {
  const [notas, setNotas] = useState([]);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState("");
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [fazendas, setFazendas] = useState([]);
  const [progresso, setProgresso] = useState(0);
  const [totalNotas, setTotalNotas] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const transportadoras = [
    { id: 1, nome: "CARGO POLO COMERCIO, LOGISTICA" },
    { id: 3, nome: "EXPRESSO NEPOMUCENO S/A" },
    { id: 2, nome: "EUCLIDES RENATO GARBUÍO TRANSPORTE" },
    { id: 4, nome: "EXPRESSO OLSEN TRANSPORTES" },
    { id: 5, nome: "JSL S.A.-MS" },
    { id: 6, nome: "PLACIDOS TRANSP RODOVIARIO LTDA" },
    { id: 7, nome: "SERRANALOG TRANSPORTES LTDA" },
    { id: 8, nome: "VDA LOGISTICA LTDA-SP" },
  ];

  useEffect(() => {
    async function buscarFazendas() {
      const { data, error } = await supabase.from('fazendas').select('*');
      if (error) {
        console.error("Erro ao buscar fazendas:", error);
      } else {
        setFazendas(data);
      }
    }
    buscarFazendas();
  }, []);

  async function extrairTextoPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let textoFinal = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const pagina = await pdf.getPage(i);
      const textoContent = await pagina.getTextContent();
      const textoPagina = textoContent.items.map(item => item.str).join(' ');
      textoFinal += textoPagina + " ";
    }
    return textoFinal;
  }

  function detectarNumeroNF(texto) {
    const match = texto.match(/(?:Nota Fiscal|Fatura|NF|No\.?)\s*[:\-]?\s*(\d{5,12})/i);
    if (match) {
      const numeroCapturado = match[1];
      return parseInt(numeroCapturado, 10);
    }
    return null;
  }

  function dividirEmLotes(array, tamanho) {
    const lotes = [];
    for (let i = 0; i < array.length; i += tamanho) {
      lotes.push(array.slice(i, i + tamanho));
    }
    return lotes;
  }

  function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const handleUpload = async () => {
    try {
      if (!transportadoraSelecionada || !fazendaSelecionada) {
        toast.error("Selecione transportadora e fazenda!");
        return;
      }

      const fazenda = fazendas.find(f => f.id === parseInt(fazendaSelecionada));
      if (!fazenda) {
        toast.error("Fazenda inválida!");
        return;
      }

      setProgresso(0);
      setTotalNotas(notas.length);
      setEnviando(true);

      async function enviarNota(nota) {
        let tentativas = 0;
        let sucesso = false;
        let ultimoErro = null;

        while (tentativas < 3 && !sucesso) {
          try {
            const idNota = uuidv4();
            const nomeArquivo = `${idNota}_${nota.name}`; // Nome simples
            const caminhoCompleto = `notas/${nomeArquivo}`; // Para salvar no banco

            const texto = await extrairTextoPDF(nota);
            const numeroNF = detectarNumeroNF(texto);

            if (!numeroNF) throw new Error(`Número da NF não encontrado para ${nota.name}`);

            // Upload: só nomeArquivo, sem 'notas/'
            const { error: errorUpload } = await supabase.storage
              .from("notas")
              .upload(nomeArquivo, nota);

            if (errorUpload) {
              throw new Error(`Erro no upload: ${errorUpload.message}`);
            }
            // Insert: salvar no banco já prefixado com 'notas/'
            const { error: errorInsert } = await supabase
              .from("documentos_notas")
              .insert([{
                id: idNota,
                nome_arquivo: nota.name,
                url: caminhoCompleto, // 🔥 aqui usamos o 'notas/nome'
                transportadora_id: transportadoraSelecionada?.id ?? null,
                transportadora_nome: transportadoraSelecionada?.nome ?? null,
                status: "pendente",
                fazenda: fazenda.nome,
                estado: fazenda.estado,
                data_envio: new Date(),
                numero_nf: numeroNF
              }]);

            if (errorInsert) throw new Error(`Erro insert: ${errorInsert.message}`);

            sucesso = true;
            return { status: "ok", nota: nota.name };

          } catch (err) {
            console.warn(`Tentativa ${tentativas + 1} falhou:`, err.message);
            ultimoErro = err;
            tentativas++;
          }
        }

        if (!sucesso) {
          return { status: "erro", nota: nota.name, erro: ultimoErro.message };
        }
      }

      async function processarNotasBatch(lotes) {
        let todasNotasSucesso = [];
        let todasNotasFalha = [];

        for (const [index, batch] of lotes.entries()) {
          console.log(`🚚 Enviando lote ${index + 1}/${lotes.length}`);

          const resultados = await Promise.allSettled(
            batch.map(async (nota) => {
              const resultado = await enviarNota(nota);
              setProgresso(prev => prev + 1);
              return resultado;
            })
          );

          const sucesso = resultados.filter(r => r.status === "fulfilled" && r.value.status === "ok").map(r => r.value.nota);
          const falhas = resultados.filter(r => r.status === "fulfilled" && r.value.status === "erro").map(r => ({ ...r.value }));

          todasNotasSucesso.push(...sucesso);
          todasNotasFalha.push(...falhas);

          if (index < lotes.length - 1) {
            await esperar(12000);
          }
        }

        return { todasNotasSucesso, todasNotasFalha };
      }

      const lotes = dividirEmLotes(notas, 25);

      const { todasNotasSucesso, todasNotasFalha } = await processarNotasBatch(lotes);

      if (todasNotasFalha.length > 0) {
        toast.error(`❌ ${todasNotasFalha.length} notas falharam! Veja o console.`);
        console.table(todasNotasFalha);
      } else {
        toast.success(`✅ Todas notas enviadas com sucesso!`);
      }

      setNotas([]);
      setEnviando(false);

    } catch (error) {
      console.error("Erro geral:", error);
      toast.error("Erro inesperado no upload!");
      setEnviando(false);
    }
  };

  const handleSelecionarNotas = (e) => {
    const arquivosSelecionados = Array.from(e.target.files);
    setNotas(arquivosSelecionados);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-auto p-4">

       <GlobalHeader />
          {/* Botão de voltar */}
      <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-white text-black px-4 py-2 rounded hover:bg-gray-300 font-semibold shadow"
      >
          ⬅ Voltar
      </button>


      <div className="min-h-screen bg-gradient-to-r from-blue-800 to-green-600 p-8 flex justify-center pt-10 md:pt-20">



        <div className="w-full max-w-3xl bg-white/10 backdrop-blur-md rounded-xl shadow-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Upload de Notas Fiscais
          </h1>

          {/* Selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <select
              onChange={(e) => {
                const selected = transportadoras.find(t => t.id === parseInt(e.target.value));
                setTransportadoraSelecionada(selected);
              }}
              className="p-3 rounded text-black"
              defaultValue=""
            >
              <option value="" disabled>Selecione a Transportadora</option>
              {transportadoras.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>

            <select
              onChange={(e) => setFazendaSelecionada(e.target.value)}
              className="p-3 rounded text-black"
              defaultValue=""
            >
              <option value="" disabled>Selecione a Fazenda</option>
              {fazendas.map((f) => (
                <option key={f.id} value={f.id}>{f.nome} ({f.estado})</option>
              ))}
            </select>
          </div>

          {/* Upload */}
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Selecionar PDF(s):</label>
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleSelecionarNotas}
              className="block w-full text-black bg-white p-2 rounded"
            />
            <p className="mt-2 text-sm text-white/80">
              {notas.length} arquivo(s) selecionado(s)
            </p>
          </div>

          {/* Progresso */}
          {enviando && (
            <div className="mb-6">
              <div className="text-yellow-300 font-semibold mb-2">
                Enviando notas... ({progresso}/{totalNotas})
              </div>
              <div className="w-full bg-white/20 h-4 rounded overflow-hidden">
                <div
                  className="bg-yellow-400 h-full transition-all duration-300"
                  style={{ width: `${(progresso / totalNotas) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Botão */}
          <button
            onClick={handleUpload}
            disabled={enviando}
            className={`mt-4 w-full py-3 rounded text-white font-bold transition ${
              enviando
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {enviando ? "Enviando..." : "📤 Enviar Arquivos"}
          </button>
        </div>
      </div>
    </div>
  );

};

export default UploadNotas;
