import { diaDoMes, letraDaSemana } from '../lib/format';
import type { DiaSemana } from '../lib/types';

interface Props {
  dias: DiaSemana[];
  selecionada: string;
  aoSelecionar: (data: string) => void;
}

export default function FaixaSemanal({ dias, selecionada, aoSelecionar }: Props) {
  return (
    <div className="semana" role="group" aria-label="dias da semana">
      {dias.map((dia) => (
        <button
          key={dia.data}
          type="button"
          className="semana-dia"
          aria-pressed={dia.data === selecionada}
          aria-label={`${dia.data} — ${Math.round(dia.calorias)} kcal`}
          onClick={() => aoSelecionar(dia.data)}
        >
          <span className="semana-letra">{letraDaSemana(dia.data)}</span>
          <span className="semana-numero">{diaDoMes(dia.data)}</span>
          <span className={dia.tem_registro ? 'semana-ponto' : 'semana-ponto vazio'} />
        </button>
      ))}
    </div>
  );
}
