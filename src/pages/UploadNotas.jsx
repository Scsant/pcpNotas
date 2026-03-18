import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineArrowUpTray,
  HiOutlineArrowLeft,
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
  HiOutlineDocumentArrowUp,
} from "react-icons/hi2";
import { supabase } from "../supabaseClient";
import GlobalHeader from "../components/GlobalHeader";
import { transportadorasConfig } from "../lib/transportadoras";

const pdfjsVersion = "3.11.174";
GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;

const UploadNotas = () => {
  const [notas, setNotas] = useState([]);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState(null);
  const [fazendaSelecionada, setFazendaSelecionada] = useState("");
  const [fazendas, setFazendas] = useState([]);
  const [progresso, setProgresso] = useState(0);
  const [totalNotas, setTotalNotas] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  const transportadoras = useMemo(
    () =>
      transportadorasConfig.map((item) => ({
        id: item.id,
        nome: item.nome,
        nomeDocumento: item.nomeDocumento,
      })),
    []
  );

  useEffect(() => {
    async function buscarFazendas() {
      const { data, error } = await supabase.from("fazendas").select("*").order("nome");
      if (error) {
        console.error("Erro ao buscar fazendas:", error);
      } else {
        setFazendas(data || []);
      }
    }
    buscarFazendas();
  }, []);

  const extractChave = (texto) => {
    const match = texto.replace(/\s+/g, "").match(/(\d{44})/);
    return match ? match[1] : null;
  };

  const extractCampoLabel = (texto, labelPatterns = []) => {
    const lines = texto.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const pat of labelPatterns) {
        const reSame = new RegExp(`${pat}\\s*[:\\-]?\\s*(.+)`, "i");
        const mSame = line.match(reSame);
        if (mSame && mSame[1]) {
          const value = mSame[1].trim();
          if (value && value.toLowerCase() !== pat.replace(/\\\\b|\\\\s|\\\\/g, "").toLowerCase()) {
            return value;
          }
        }

        const reLabelOnly = new RegExp(`^${pat}$`, "i");
        const reLabelAnywhere = new RegExp(pat, "i");
        if (
          reLabelOnly.test(line) ||
          (reLabelAnywhere.test(line) &&
            line.toLowerCase().startsWith(pat.replace("\\b", "").toLowerCase()) &&
            line.length <= pat.length + 3)
        ) {
          for (let j = i + 1; j < Math.min(lines.length, i + 4); j += 1) {
            const candidate = lines[j].trim();
            if (!candidate) continue;
            let isLabel = false;
            for (const other of labelPatterns) {
              if (new RegExp(`^${other}$`, "i").test(candidate)) isLabel = true;
            }
            if (!isLabel) return candidate;
          }
        }

        const reInline = new RegExp(`${pat}\\s*[:\\-]?\\s*([\\w\\s\\-\\/.]+)`, "i");
        const mInline = texto.match(reInline);
        if (mInline && mInline[1]) {
          const value = mInline[1].trim();
          if (value && value.toLowerCase() !== pat.replace(/\\\\b|\\\\s|\\\\/g, "").toLowerCase()) {
            return value;
          }
        }
      }
    }
    return null;
  };

  const extractRemessa = (texto) => extractCampoLabel(texto, ["remessa\\b", "remessa\\s*n[oº]?\\b"]);
  const extractOrdem = (texto) => extractCampoLabel(texto, ["ordem\\b", "ordem\\s*n[oº]?\\b"]);
  const extractPedido = (texto) => extractCampoLabel(texto, ["pedido\\b", "pedido\\s*n[oº]?\\b"]);
  const extractFatura = (texto) => extractCampoLabel(texto, ["fatura\\b", "fatura\\s*n[oº]?\\b"]);

  const extractFazenda = (texto) => {
    let found = extractCampoLabel(texto, ["fazenda\\b", "destinatario\\b", "destinatário\\b"]);
    if (found) return found;

    found = extractCampoLabel(texto, ["fatura\\b", "remessa\\b", "ordem\\b", "pedido\\b"]);
    if (found) return found;

    return null;
  };

  async function extrairTextoPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;
    let textoFinal = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const pagina = await pdf.getPage(i);
      const textoContent = await pagina.getTextContent();
      const textoPagina = textoContent.items.map((item) => item.str).join("\n");
      textoFinal += `${textoPagina}\n`;
    }
    return textoFinal;
  }

  function normalizeField(value) {
    if (!value) return null;
    const normalized = value.toString().trim();
    if (/^(remessa|fatura|ordem|pedido|fazenda)$/i.test(normalized)) return null;
    return normalized.replace(/^(remessa|fatura|ordem|pedido)[:\s\-]*/i, "").trim();
  }

  function detectarNumeroNF(texto) {
    const match = texto.match(/(?:Nota Fiscal|Fatura|NF|No\.?)\s*[:\-]?\s*(\d{5,12})/i);
    if (match) {
      return parseInt(match[1], 10);
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
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const handleUpload = async () => {
    try {
      if (!transportadoraSelecionada || !fazendaSelecionada) {
        toast.error("Selecione transportadora e fazenda.");
        return;
      }

      const fazenda = fazendas.find((item) => item.id === parseInt(fazendaSelecionada, 10));
      if (!fazenda) {
        toast.error("Fazenda inválida.");
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
            const nomeArquivo = `${idNota}_${nota.name}`;
            const caminhoCompleto = nomeArquivo;

            let texto = null;
            try {
              texto = await extrairTextoPDF(nota);
            } catch (error) {
              console.warn("Falha ao extrair texto no cliente:", error);
            }

            let numeroNF = null;
            if (texto) {
              console.debug("Preview extracted text (first 500 chars):", texto.slice(0, 500));
              numeroNF = detectarNumeroNF(texto);
            }

            const debugChave = texto ? extractChave(texto) : null;
            const debugRemessa = normalizeField(texto ? extractRemessa(texto) : null);
            const debugOrdem = normalizeField(texto ? extractOrdem(texto) : null);
            const debugPedido = normalizeField(texto ? extractPedido(texto) : null);
            const debugFatura = normalizeField(texto ? extractFatura(texto) : null);
            const debugFazenda = normalizeField(texto ? extractFazenda(texto) : null);
            console.debug("Extraction results", {
              numeroNF,
              chave: debugChave,
              remessa: debugRemessa,
              ordem: debugOrdem,
              pedido: debugPedido,
              fatura: debugFatura,
              nomeFaz: debugFazenda,
            });

            if (!numeroNF) throw new Error(`Número da NF não encontrado para ${nota.name}.`);

            const { error: errorUpload } = await supabase.storage.from("notas").upload(nomeArquivo, nota);
            if (errorUpload) {
              throw new Error(`Erro no upload: ${errorUpload.message}`);
            }

            const { error: errorInsert } = await supabase.from("documentos_notas").insert([
              {
                id: idNota,
                nome_arquivo: nota.name,
                url: caminhoCompleto,
                transportadora_id: transportadoraSelecionada?.id ?? null,
                transportadora_nome: transportadoraSelecionada?.nomeDocumento ?? null,
                status: "pendente",
                fazenda: fazenda.nome,
                estado: fazenda.estado,
                data_envio: new Date(),
                numero_nf: numeroNF,
              },
            ]);

            if (errorInsert) throw new Error(`Erro insert: ${errorInsert.message}`);

            try {
              const chave = texto ? extractChave(texto) : null;
              const remessa = normalizeField(texto ? extractRemessa(texto) : null);
              const ordem = normalizeField(texto ? extractOrdem(texto) : null);
              const pedido = normalizeField(texto ? extractPedido(texto) : null);
              const fatura = normalizeField(texto ? extractFatura(texto) : null);
              const nomeFaz = normalizeField(texto ? extractFazenda(texto) : null);

              const { error: extErr } = await supabase.from("notas_extracao").insert([
                {
                  id: uuidv4(),
                  documento_id: idNota,
                  nome_arquivo: nota.name,
                  numero_nf: numeroNF,
                  remessa,
                  ordem,
                  pedido,
                  fatura,
                  chave_acesso: chave,
                  nome_fazenda: nomeFaz,
                  raw_text: texto,
                },
              ]);

              if (extErr) console.warn("Erro ao inserir notas_extracao:", extErr);
            } catch (error) {
              console.warn("Falha na extração:", error);
            }

            sucesso = true;
            return { status: "ok", nota: nota.name };
          } catch (error) {
            console.warn(`Tentativa ${tentativas + 1} falhou:`, error.message);
            ultimoErro = error;
            tentativas += 1;
          }
        }

        if (!sucesso) {
          return { status: "erro", nota: nota.name, erro: ultimoErro?.message };
        }

        return { status: "erro", nota: nota.name, erro: "Falha desconhecida." };
      }

      async function processarNotasBatch(lotes) {
        let todasNotasFalha = [];

        for (const [index, batch] of lotes.entries()) {
          console.log(`Enviando lote ${index + 1}/${lotes.length}`);

          const resultados = await Promise.allSettled(
            batch.map(async (nota) => {
              const resultado = await enviarNota(nota);
              setProgresso((prev) => prev + 1);
              return resultado;
            })
          );

          const falhas = resultados
            .filter((item) => item.status === "fulfilled" && item.value.status === "erro")
            .map((item) => ({ ...item.value }));

          todasNotasFalha = [...todasNotasFalha, ...falhas];

          if (index < lotes.length - 1) {
            await esperar(12000);
          }
        }

        return { todasNotasFalha };
      }

      const lotes = dividirEmLotes(notas, 25);
      const { todasNotasFalha } = await processarNotasBatch(lotes);

      if (todasNotasFalha.length > 0) {
        toast.error(`${todasNotasFalha.length} notas falharam. Veja o console.`);
        console.table(todasNotasFalha);
      } else {
        toast.success("Todas as notas foram enviadas com sucesso.");
      }

      setNotas([]);
      setEnviando(false);
    } catch (error) {
      console.error("Erro geral:", error);
      toast.error("Erro inesperado no upload.");
      setEnviando(false);
    }
  };

  const handleSelecionarNotas = (e) => {
    const arquivosSelecionados = Array.from(e.target.files || []);
    setNotas(arquivosSelecionados);
  };

  const percentual = totalNotas > 0 ? Math.min(100, Math.round((progresso / totalNotas) * 100)) : 0;

  return (
    <div className="space-y-5 pb-8">
      <GlobalHeader />

      <section className="glass-panel rounded-[28px] bg-[rgba(255,255,255,0.76)] p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Operação fiscal</p>
            <h1 className="section-title mt-2 text-2xl font-black md:text-3xl">Upload de Notas Fiscais</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Centralize o envio dos PDFs, vincule a transportadora e a fazenda corretamente e alimente a operação com
              rastreabilidade desde a entrada do documento.
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white"
          >
            <HiOutlineArrowLeft />
            Voltar
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-[rgba(248,250,252,0.86)] p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <HiOutlineBuildingOffice2 />
              Transportadora
            </p>
            <p className="mt-2 text-base font-black text-[#123b68]">
              {transportadoraSelecionada?.nome || "Aguardando seleção"}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-[rgba(248,250,252,0.86)] p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <HiOutlineDocumentArrowUp />
              Arquivos
            </p>
            <p className="mt-2 text-2xl font-black text-[#123b68]">{notas.length}</p>
          </div>

          <div className="rounded-[24px] border border-emerald-200/80 bg-[rgba(224,245,234,0.95)] p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <HiOutlineCheckCircle />
              Progresso
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-900">{percentual}%</p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[28px] bg-[rgba(255,255,255,0.78)] p-5 md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Transportadora</span>
                <select
                  onChange={(e) => {
                    const selected = transportadoras.find((item) => item.id === parseInt(e.target.value, 10));
                    setTransportadoraSelecionada(selected || null);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-[rgba(248,250,252,0.92)] px-4 py-3 text-sm text-slate-700 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione a transportadora
                  </option>
                  {transportadoras.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-600">Fazenda</span>
                <select
                  onChange={(e) => setFazendaSelecionada(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-[rgba(248,250,252,0.92)] px-4 py-3 text-sm text-slate-700 outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione a fazenda
                  </option>
                  {fazendas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} ({item.estado})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-[24px] border border-dashed border-slate-300 bg-[rgba(241,245,249,0.78)] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/90 p-2.5 text-[#123b68] shadow-sm">
                  <HiOutlineArrowUpTray className="text-lg" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Selecionar PDFs</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    Faça o upload em lote dos arquivos fiscais. O sistema extrai o número da NF e registra os dados
                    complementares para rastreabilidade.
                  </p>
                </div>
              </div>

              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleSelecionarNotas}
                className="mt-4 block w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
              />

              <div className="mt-3 rounded-2xl bg-white/90 px-4 py-3 text-sm text-slate-600">
                {notas.length > 0 ? `${notas.length} arquivo(s) pronto(s) para envio.` : "Nenhum arquivo selecionado."}
              </div>
            </div>

            {enviando && (
              <div className="rounded-[24px] border border-amber-200 bg-[rgba(254,243,199,0.88)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-amber-900">
                    Enviando notas... ({progresso}/{totalNotas})
                  </p>
                  <span className="text-sm font-semibold text-amber-800">{percentual}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4 rounded-[24px] border border-slate-200/80 bg-[rgba(248,250,252,0.88)] p-4 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Checklist operacional</p>
              <h2 className="mt-2 text-lg font-black text-[#123b68]">Antes de enviar</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                Confirme a transportadora correta para evitar notas entrando no painel errado.
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                Selecione a fazenda certa para manter o fechamento mensal consistente.
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                O envio acontece em lotes para reduzir falhas e preservar a rastreabilidade.
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={enviando || notas.length === 0}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition ${
                enviando || notas.length === 0
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-[#123b68] hover:bg-[#0f3259]"
              }`}
            >
              <HiOutlineArrowUpTray />
              {enviando ? "Enviando..." : "Enviar arquivos"}
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default UploadNotas;
