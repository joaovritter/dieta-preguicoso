import { NOME_REFEICAO, REFEICOES, horaDoTimestamp, numero } from '../lib/format';
import type { Refeicao, Registro } from '../lib/types';

interface Props {
  registro: Registro;
  ocupado: boolean;
  aoTrocarRefeicao: (id: string, refeicao: Refeicao) => void;
  aoExcluir: (id: string) => void;
}

export default function ItemRegistro({ registro, ocupado, aoTrocarRefeicao, aoExcluir }: Props) {
  return (
    <article className="registro">
      <div className="registro-topo">
        <span className="registro-descricao">{registro.descricao_bruta}</span>
        <span className="refeicao-kcal">
          {numero(registro.calorias_total)} kcal · {horaDoTimestamp(registro.criado_em)}
        </span>
      </div>

      <ul className="registro-alimentos">
        {registro.alimentos_detectados.map((alimento, indice) => (
          <li key={`${alimento.nome}-${indice}`}>
            <span>
              {alimento.nome} · {alimento.quantidade_estimada}
            </span>
            <span className="num">
              {numero(alimento.calorias)} kcal · C {numero(alimento.carboidrato_g)} · P{' '}
              {numero(alimento.proteina_g)} · G {numero(alimento.gordura_g)}
            </span>
          </li>
        ))}
      </ul>

      <div className="registro-acoes">
        <label className="mudo" style={{ fontSize: 12 }} htmlFor={`refeicao-${registro.id}`}>
          refeição
        </label>
        <select
          id={`refeicao-${registro.id}`}
          className="seletor"
          value={registro.refeicao}
          disabled={ocupado}
          onChange={(evento) => aoTrocarRefeicao(registro.id, evento.target.value as Refeicao)}
        >
          {REFEICOES.map((refeicao) => (
            <option key={refeicao} value={refeicao}>
              {NOME_REFEICAO[refeicao]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="botao-mini botao-perigo"
          disabled={ocupado}
          onClick={() => aoExcluir(registro.id)}
        >
          excluir
        </button>
      </div>
    </article>
  );
}
