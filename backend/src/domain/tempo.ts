/**
 * Conversões entre instante UTC e o calendário local do usuário.
 *
 * Todo o app grava timestamps em UTC, mas "que dia é hoje" e "que refeição é essa"
 * só fazem sentido no fuso do usuário. Estas funções são a única ponte entre os dois
 * mundos — nenhum outro módulo deve mexer com fuso na mão.
 */

export interface PartesLocais {
  ano: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

const formatadores = new Map<string, Intl.DateTimeFormat>();

function formatador(timezone: string): Intl.DateTimeFormat {
  let f = formatadores.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatadores.set(timezone, f);
  }
  return f;
}

export function timezoneValida(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function partesLocais(instante: Date, timezone: string): PartesLocais {
  const partes = formatador(timezone).formatToParts(instante);
  const valor = (tipo: Intl.DateTimeFormatPartTypes): number => {
    const p = partes.find((x) => x.type === tipo);
    return p ? Number(p.value) : 0;
  };
  // Meia-noite sai como "24" em algumas implementações de Intl com hour12:false.
  const hora = valor('hour') % 24;
  return {
    ano: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora,
    minuto: valor('minute'),
  };
}

/** Deslocamento do fuso, em ms, no instante dado. Positivo a leste de Greenwich. */
function deslocamentoMs(instante: Date, timezone: string): number {
  const p = partesLocais(instante, timezone);
  const comoUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  // Compara em granularidade de minuto: segundos e ms não participam do deslocamento.
  const base = Math.floor(instante.getTime() / 60000) * 60000;
  return comoUtc - base;
}

/** "YYYY-MM-DD" do dia em que o instante cai, no fuso do usuário. */
export function dataLocal(instante: Date, timezone: string): string {
  const p = partesLocais(instante, timezone);
  return `${String(p.ano).padStart(4, '0')}-${String(p.mes).padStart(2, '0')}-${String(p.dia).padStart(2, '0')}`;
}

/** Minutos desde a meia-noite local. */
export function minutosDoDia(instante: Date, timezone: string): number {
  const p = partesLocais(instante, timezone);
  return p.hora * 60 + p.minuto;
}

/**
 * Converte um horário de parede local em instante UTC.
 * Faz duas passadas para acertar as bordas de horário de verão: a primeira estimativa
 * usa o deslocamento errado quando o salto acontece exatamente naquele dia.
 */
export function localParaUtc(
  ano: number,
  mes: number,
  dia: number,
  hora: number,
  minuto: number,
  timezone: string,
): Date {
  const estimativa = Date.UTC(ano, mes - 1, dia, hora, minuto);
  const primeiro = deslocamentoMs(new Date(estimativa), timezone);
  const segundo = deslocamentoMs(new Date(estimativa - primeiro), timezone);
  return new Date(estimativa - segundo);
}

const RE_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseData(data: string): { ano: number; mes: number; dia: number } | null {
  const m = RE_DATA.exec(data);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { ano, mes, dia };
}

/** Intervalo `[inicio, fim)` em UTC que cobre o dia local "YYYY-MM-DD". */
export function intervaloDoDia(data: string, timezone: string): { inicio: Date; fim: Date } {
  const p = parseData(data);
  if (!p) throw new Error(`data inválida: ${data}`);
  const inicio = localParaUtc(p.ano, p.mes, p.dia, 0, 0, timezone);
  // +1 dia no calendário local, não +24h — cobre dias de 23 e 25 horas.
  const proximo = new Date(Date.UTC(p.ano, p.mes - 1, p.dia + 1));
  const fim = localParaUtc(
    proximo.getUTCFullYear(),
    proximo.getUTCMonth() + 1,
    proximo.getUTCDate(),
    0,
    0,
    timezone,
  );
  return { inicio, fim };
}

/** Soma `dias` ao calendário e devolve "YYYY-MM-DD". Aceita valores negativos. */
export function somarDias(data: string, dias: number): string {
  const p = parseData(data);
  if (!p) throw new Error(`data inválida: ${data}`);
  const d = new Date(Date.UTC(p.ano, p.mes - 1, p.dia + dias));
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
