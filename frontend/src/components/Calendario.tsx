import { LETRAS_SEMANA, TEXTO_STATUS, deISO, numero } from '../lib/format';
import type { ProgressoDia } from '../lib/types';

/** Grade do mês, um quadradinho por dia, colorido pelo status em relação à meta. */
export default function Calendario({ dias }: { dias: ProgressoDia[] }) {
  if (dias.length === 0) return <p className="mudo estado-vazio">sem dias nesse mês</p>;

  // O dia 1 não cai necessariamente no domingo: empurro a grade com células vazias.
  const vazios = deISO(dias[0]!.data).getDay();

  return (
    <div className="cal">
      <div className="cal-grade" aria-hidden="true">
        {LETRAS_SEMANA.map((letra, indice) => (
          <span className="cal-letra" key={indice}>
            {letra}
          </span>
        ))}
      </div>
      <div className="cal-grade">
        {Array.from({ length: vazios }, (_, indice) => (
          <span className="cal-dia vazio" key={`vazio-${indice}`} />
        ))}
        {dias.map((dia) => {
          const texto = `${dia.data} — ${numero(dia.calorias)} kcal, ${TEXTO_STATUS[dia.status]}`;
          return (
            <span
              className={`cal-dia status-${dia.status}`}
              key={dia.data}
              title={texto}
              aria-label={texto}
            >
              {deISO(dia.data).getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
