import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { mensagemDoErro } from '../lib/api';
import Campo from '../components/Campo';
import Erro from '../components/Erro';

type Aba = 'entrar' | 'cadastrar';

export default function Login() {
  const { entrar, cadastrar } = useAuth();
  const [aba, setAba] = useState<Aba>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cadastrando = aba === 'cadastrar';
  const senhaCurta = cadastrando && senha.length > 0 && senha.length < 8;
  const senhasDiferentes = cadastrando && repetida.length > 0 && repetida !== senha;
  const podeEnviar =
    email.trim().length > 0 &&
    senha.length > 0 &&
    !senhaCurta &&
    (!cadastrando || (nome.trim().length > 0 && repetida === senha)) &&
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
              setRepetida('');
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

      <form onSubmit={(evento) => void enviar(evento)}>
        {cadastrando && (
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

        <Campo
          rotulo="senha"
          tipo="password"
          valor={senha}
          aoMudar={setSenha}
          autoComplete={cadastrando ? 'new-password' : 'current-password'}
          aviso={senhaCurta ? 'mínimo de 8 caracteres' : undefined}
        />

        {cadastrando && (
          <Campo
            rotulo="repita a senha"
            tipo="password"
            valor={repetida}
            aoMudar={setRepetida}
            autoComplete="new-password"
            aviso={senhasDiferentes ? 'as senhas não são iguais' : undefined}
          />
        )}

        <button type="submit" className="botao botao-primario" style={{ width: '100%' }} disabled={!podeEnviar}>
          {enviando ? 'aguarde...' : cadastrando ? 'criar conta' : 'entrar'}
        </button>
      </form>
    </main>
  );
}
