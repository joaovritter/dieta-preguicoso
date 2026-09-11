import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { api, mensagemDoErro } from '../lib/api';
import { paraEntrada, paraFormulario } from './formularioPerfil';
import type { Formulario } from './formularioPerfil';
import Campo, { Interruptor } from '../components/Campo';
import SecaoDadosPessoais from '../components/SecaoDadosPessoais';
import SecaoMetas from '../components/SecaoMetas';
import FaixasHorario from '../components/FaixasHorario';
import Erro from '../components/Erro';
import type { Perfil } from '../lib/types';

export default function PerfilPage() {
  const { perfil } = useAuth();
  if (perfil === null) return <p className="carregando-pagina">carregando...</p>;
  return <FormularioPerfil inicial={perfil} />;
}

function FormularioPerfil({ inicial }: { inicial: Perfil }) {
  const { definirPerfil, sair } = useAuth();
  const [form, setForm] = useState<Formulario>(() => paraFormulario(inicial));
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function mudar<C extends keyof Formulario>(campo: C, valor: Formulario[C]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setAviso(null);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.salvarPerfil(paraEntrada(form));
      definirPerfil(atualizado);
      setForm(paraFormulario(atualizado)); // reflete metas recalculadas pelo servidor
      setAviso('perfil salvo');
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="app" style={{ paddingBottom: 32 }}>
      <header className="topo">
        <h1>perfil</h1>
        <div>
          <Link className="link-texto" to="/">
            voltar
          </Link>
          <button type="button" className="link-texto" onClick={sair}>
            sair
          </button>
        </div>
      </header>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
      {aviso !== null && (
        <p className="mudo" role="status">
          {aviso}
        </p>
      )}

      <form onSubmit={(evento) => void salvar(evento)}>
        <SecaoDadosPessoais form={form} aoMudar={mudar} />
        <SecaoMetas form={form} aoMudar={mudar} />

        <section className="cartao">
          <h2 className="titulo-secao">registro</h2>
          <Interruptor
            rotulo="modo preguiçoso"
            dica="grava direto, sem tela de confirmação"
            ligado={form.modo_preguicoso}
            aoMudar={(v) => mudar('modo_preguicoso', v)}
          />
          <Campo rotulo="timezone" valor={form.timezone} aoMudar={(v) => mudar('timezone', v)} />
        </section>

        <section className="cartao">
          <h2 className="titulo-secao">faixas de horário</h2>
          <FaixasHorario
            faixas={form.faixas_refeicao}
            aoMudar={(faixas) => mudar('faixas_refeicao', faixas)}
          />
        </section>

        <button
          type="submit"
          className="botao botao-primario"
          style={{ width: '100%' }}
          disabled={salvando}
        >
          {salvando ? 'salvando...' : 'salvar'}
        </button>
      </form>
    </main>
  );
}
