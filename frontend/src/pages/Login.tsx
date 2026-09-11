import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { mensagemDoErro } from '../lib/api';
import Erro from '../components/Erro';

type Aba = 'entrar' | 'cadastrar';

export default function Login() {
  const { entrar, cadastrar } = useAuth();
  const [aba, setAba] = useState<Aba>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const senhaCurta = aba === 'cadastrar' && senha.length > 0 && senha.length < 8;
  const podeEnviar =
    email.trim().length > 0 &&
    senha.length > 0 &&
    !senhaCurta &&
    (aba === 'entrar' || nome.trim().length > 0) &&
    !enviando;

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (aba === 'entrar') await entrar(email.trim(), senha);
      else await cadastrar(email.trim(), senha, nome.trim());
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <h1>dieta preguiçoso</h1>
      <p className="mudo">registre por foto, áudio ou texto. o resto é com a IA.</p>

      <div className="abas" role="tablist">
        {(['entrar', 'cadastrar'] as Aba[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            className="aba"
            aria-selected={aba === item}
            onClick={() => {
              setAba(item);
              setErro(null);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <form onSubmit={(evento) => void enviar(evento)}>
        {aba === 'cadastrar' && (
          <label className="campo">
            <span className="campo-rotulo">nome</span>
            <input
              className="campo-entrada"
              value={nome}
              autoComplete="name"
              onChange={(evento) => setNome(evento.target.value)}
            />
          </label>
        )}

        <label className="campo">
          <span className="campo-rotulo">e-mail</span>
          <input
            className="campo-entrada"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(evento) => setEmail(evento.target.value)}
          />
        </label>

        <label className="campo">
          <span className="campo-rotulo">senha</span>
          <input
            className="campo-entrada"
            type="password"
            value={senha}
            autoComplete={aba === 'entrar' ? 'current-password' : 'new-password'}
            onChange={(evento) => setSenha(evento.target.value)}
          />
          {senhaCurta && <span className="campo-rotulo">mínimo de 8 caracteres</span>}
        </label>

        <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={!podeEnviar}>
          {enviando ? 'aguarde...' : aba === 'entrar' ? 'entrar' : 'criar conta'}
        </button>
      </form>
    </main>
  );
}
