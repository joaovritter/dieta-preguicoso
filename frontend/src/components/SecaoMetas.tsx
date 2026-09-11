import Campo, { Interruptor } from './Campo';
import type { Formulario } from '../pages/formularioPerfil';

interface Props {
  form: Formulario;
  aoMudar: <C extends keyof Formulario>(campo: C, valor: Formulario[C]) => void;
}

export default function SecaoMetas({ form, aoMudar }: Props) {
  const travadas = form.metas_automaticas;

  return (
    <section className="cartao">
      <h2 className="titulo-secao">metas</h2>

      <Interruptor
        rotulo="metas automáticas"
        dica="calcula a partir de peso, altura, idade, sexo e objetivo"
        ligado={form.metas_automaticas}
        aoMudar={(v) => aoMudar('metas_automaticas', v)}
      />

      <Campo
        rotulo="calorias"
        sufixo="kcal"
        tipo="number"
        valor={form.meta_calorias}
        somenteLeitura={travadas}
        aoMudar={(v) => aoMudar('meta_calorias', v)}
      />

      <div className="linha-campos">
        <Campo
          rotulo="carboidrato"
          sufixo="g"
          tipo="number"
          valor={form.meta_carboidrato_g}
          somenteLeitura={travadas}
          aoMudar={(v) => aoMudar('meta_carboidrato_g', v)}
        />
        <Campo
          rotulo="proteína"
          sufixo="g"
          tipo="number"
          valor={form.meta_proteina_g}
          somenteLeitura={travadas}
          aoMudar={(v) => aoMudar('meta_proteina_g', v)}
        />
      </div>

      <div className="linha-campos">
        <Campo
          rotulo="gordura"
          sufixo="g"
          tipo="number"
          valor={form.meta_gordura_g}
          somenteLeitura={travadas}
          aoMudar={(v) => aoMudar('meta_gordura_g', v)}
        />
        <Campo
          rotulo="água"
          sufixo="ml"
          tipo="number"
          valor={form.meta_agua_ml}
          somenteLeitura={travadas}
          aoMudar={(v) => aoMudar('meta_agua_ml', v)}
        />
      </div>

      {travadas && (
        <p className="mudo" style={{ fontSize: 12, margin: 0 }}>
          valores calculados pelo servidor ao salvar
        </p>
      )}
    </section>
  );
}
