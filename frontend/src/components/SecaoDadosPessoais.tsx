import Campo from './Campo';
import { NOME_OBJETIVO } from '../lib/format';
import type { Formulario } from '../pages/formularioPerfil';
import type { Objetivo, Sexo } from '../lib/types';

interface Props {
  form: Formulario;
  aoMudar: <C extends keyof Formulario>(campo: C, valor: Formulario[C]) => void;
}

export default function SecaoDadosPessoais({ form, aoMudar }: Props) {
  return (
    <section className="cartao">
      <h2 className="titulo-secao">você</h2>

      <Campo rotulo="nome" valor={form.nome} aoMudar={(v) => aoMudar('nome', v)} />

      <label className="campo">
        <span className="campo-rotulo">sexo</span>
        <select
          className="campo-entrada"
          value={form.sexo}
          onChange={(evento) => aoMudar('sexo', evento.target.value as '' | Sexo)}
        >
          <option value="">não informado</option>
          <option value="M">masculino</option>
          <option value="F">feminino</option>
        </select>
      </label>

      <div className="linha-campos">
        <Campo rotulo="idade" tipo="number" valor={form.idade} aoMudar={(v) => aoMudar('idade', v)} />
        <Campo
          rotulo="peso"
          sufixo="kg"
          tipo="number"
          valor={form.peso_kg}
          aoMudar={(v) => aoMudar('peso_kg', v)}
        />
      </div>

      <div className="linha-campos">
        <Campo
          rotulo="altura"
          sufixo="cm"
          tipo="number"
          valor={form.altura_cm}
          aoMudar={(v) => aoMudar('altura_cm', v)}
        />
        <label className="campo">
          <span className="campo-rotulo">objetivo</span>
          <select
            className="campo-entrada"
            value={form.objetivo}
            onChange={(evento) => aoMudar('objetivo', evento.target.value as Objetivo)}
          >
            {(Object.keys(NOME_OBJETIVO) as Objetivo[]).map((item) => (
              <option key={item} value={item}>
                {NOME_OBJETIVO[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
