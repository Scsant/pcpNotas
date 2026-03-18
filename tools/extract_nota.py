import re
from dataclasses import dataclass
from typing import List, Optional
from dateutil import parser as dateparser
import fitz  # PyMuPDF

# -----------------------------
# Helpers
# -----------------------------

def only_digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def to_date(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    s = s.replace(".", "/").replace("-", "/")
    try:
        return dateparser.parse(s, dayfirst=True).date().isoformat()
    except Exception:
        return None


def to_decimal(s: Optional[str]) -> Optional[float]:
    if not s:
        return None
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None

# Regexes
RE_CHAVE = re.compile(r"(\d[\d\s]{41,})")
RE_CNPJ = re.compile(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}")
RE_IE = re.compile(r"INSCRI[ÇC][AÃ]O\s+ESTADUAL\s*\n?\s*([\d\.\-]+)", re.IGNORECASE)
RE_NOTA = re.compile(r"(?:N[ºo]|No\.)\s*(\d+)")
RE_SERIE = re.compile(r"S[ÉE]RIE\s+(\d+)", re.IGNORECASE)
RE_PROTOCOLO = re.compile(r"PROTOCOLO\s+DE\s+AUTORIZA[ÇC][AÃ]O\s*\n?\s*([\d]+)", re.IGNORECASE)
RE_DATA_EMISSAO = re.compile(r"DATA\s+DA\s+EMISS[ÃA]O\s*\n?\s*([\d\./-]{8,10})", re.IGNORECASE)
RE_DATA_SAIDA = re.compile(r"DATA\s+DE\s+SA[ÍI]DA/ENTRADA\s*\n?\s*([\d\./-]{8,10})", re.IGNORECASE)
RE_VALOR_TOTAL = re.compile(r"VALOR\s+TOTAL\s+DA\s+NOTA\s*\n?\s*([\d\.,]+)", re.IGNORECASE)
RE_UF = re.compile(r"\bUF\b\s*\n?\s*([A-Z]{2})")
RE_ORDEM = re.compile(r"Ordem\s+de\s+Venda[:\s]*([0-9A-Za-z\-\.]+)", re.IGNORECASE)
RE_REMESSA = re.compile(r"Remessa[:\s]*([0-9A-Za-z\-\.]+)", re.IGNORECASE)
RE_FATURA = re.compile(r"Fatura[:\s]*([0-9A-Za-z\-\.]+)", re.IGNORECASE)
# Try to detect FAZENDA label or block with uppercase words (heuristic)
RE_FAZENDA = re.compile(r"FAZENDA\s*[:\-]?\s*([A-Z0-9\s\-\._,/]+)", re.IGNORECASE)

@dataclass
class NotaExtraida:
    nota_fiscal: Optional[str] = None
    serie: Optional[str] = None
    chave_acesso: Optional[str] = None
    protocolo: Optional[str] = None
    data_emissao: Optional[str] = None
    data_saida: Optional[str] = None
    valor_total_nota: Optional[float] = None
    emitente_cnpj: Optional[str] = None
    emitente_ie: Optional[str] = None
    destinatario_cnpj: Optional[str] = None
    destinatario_ie: Optional[str] = None
    fazenda: Optional[str] = None
    uf: Optional[str] = None
    ordem: Optional[str] = None
    remessa: Optional[str] = None
    fatura: Optional[str] = None
    page_index: int = -1


def normalize_chave(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    return only_digits(raw)[:44] if len(only_digits(raw)) >= 44 else None


def find_fazenda_after_labels(text: str, labels: List[str]) -> Optional[str]:
    # Split into lines and search for a label line, then return next non-empty line
    lines = [l.strip() for l in text.splitlines()]
    for i, line in enumerate(lines):
        for lab in labels:
            if re.search(lab, line, re.IGNORECASE):
                # take next lines up to 3 to find candidate
                for j in range(i+1, min(i+4, len(lines))):
                    candidate = lines[j]
                    if not candidate:
                        continue
                    # Heuristic filters:
                    # - skip if looks like a chave (long sequence of digits/spaces)
                    # - skip if contains a CNPJ pattern or an URL or mostly digits
                    # - accept if it has at least 3 letters (to avoid picking keys)
                    if re.search(r"\d[\d\s]{20,}", candidate):
                        continue
                    if RE_CNPJ.search(candidate):
                        continue
                    if re.search(r"https?://|www\\.|\\.com|\\.br", candidate, re.IGNORECASE):
                        continue
                    # skip lines that are mostly numeric or punctuation
                    letter_count = len(re.findall(r"[A-Za-zÀ-ÖØ-öø-ÿ]", candidate))
                    digit_count = len(re.findall(r"\d", candidate))
                    if letter_count < 3:
                        continue
                    # good candidate
                    return candidate
    return None


def extract_from_text(text: str, page_index: int) -> NotaExtraida:
    nota = NotaExtraida(page_index=page_index)

    # Número NF
    m = RE_NOTA.search(text)
    if m:
        nota.nota_fiscal = m.group(1).lstrip("0") or m.group(1)

    # Série
    m = RE_SERIE.search(text)
    if m:
        nota.serie = m.group(1)

    # Chave de acesso
    m = RE_CHAVE.search(text)
    if m:
        nota.chave_acesso = normalize_chave(m.group(1))

    # Protocolo
    m = RE_PROTOCOLO.search(text)
    if m:
        nota.protocolo = m.group(1)

    # Datas
    m = RE_DATA_EMISSAO.search(text)
    if m:
        nota.data_emissao = to_date(m.group(1))

    m = RE_DATA_SAIDA.search(text)
    if m:
        nota.data_saida = to_date(m.group(1))

    # Valor total da nota
    m = RE_VALOR_TOTAL.search(text)
    if m:
        nota.valor_total_nota = to_decimal(m.group(1))

    # Ordem, Remessa, Fatura
    m = RE_ORDEM.search(text)
    if m:
        ordem_value = m.group(1)
        ordem_value = ordem_value.replace("-ZVFL", "").strip()
        nota.ordem = ordem_value

    m = RE_REMESSA.search(text)
    if m:
        nota.remessa = m.group(1)

    m = RE_FATURA.search(text)
    if m:
        nota.fatura = m.group(1)

    # UF
    m = RE_UF.search(text)
    if m:
        nota.uf = m.group(1)

    # Fazenda (heurística)
    m = RE_FAZENDA.search(text)
    if m:
        nota.fazenda = m.group(1).strip().upper()
    else:
        # Try to find fazenda after labels like REMESSA/ORDEM/PEDIDO
        found = find_fazenda_after_labels(text, [r"Remessa", r"Ordem", r"Pedido", r"Remessa:"])
        if found:
            nota.fazenda = found.strip().upper()
        else:
            # Try blocks like LOCAL DE RETIRADA / LOCAL DE ENTREGA
            found2 = re.search(r"LOCAL\s+DE\s+(RETIRADA|ENTREGA)[:\s\n]+([A-Z0-9\s\-\.,/]+)", text, re.IGNORECASE)
            if found2:
                nota.fazenda = found2.group(2).strip().upper()

    # CNPJ Emitente
    emitente_cnpj = None
    ie_match = RE_IE.search(text)
    if ie_match:
        ie_end = ie_match.end()
        after_ie = text[ie_end:ie_end+200]
        cnpj_match = RE_CNPJ.search(after_ie)
        if cnpj_match:
            emitente_cnpj = cnpj_match.group(0)
    if not emitente_cnpj:
        cnpjs = RE_CNPJ.findall(text)
        if len(cnpjs) >= 1:
            emitente_cnpj = cnpjs[0]
    nota.emitente_cnpj = emitente_cnpj

    # CNPJ Destinatário
    cnpjs = RE_CNPJ.findall(text)
    if len(cnpjs) >= 2:
        nota.destinatario_cnpj = cnpjs[1]

    # IEs
    ies = RE_IE.findall(text)
    if len(ies) >= 1:
        nota.emitente_ie = ies[0]
    if len(ies) >= 2:
        nota.destinatario_ie = ies[1]

    return nota


def process_pdf(pdf_path: str) -> List[NotaExtraida]:
    doc = fitz.open(pdf_path)
    result: List[NotaExtraida] = []
    for i, page in enumerate(doc):
        txt = page.get_text("text")
        nota = extract_from_text(txt, i)
        result.append(nota)
    return result


if __name__ == '__main__':
    import sys
    if len(sys.argv) < 2:
        print('Uso: python extract_nota.py arquivo.pdf')
        sys.exit(1)
    path = sys.argv[1]
    res = process_pdf(path)
    from dataclasses import asdict
    import json
    print(json.dumps([asdict(r) for r in res], ensure_ascii=False, indent=2))
