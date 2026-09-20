import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { useAuth } from '../auth/useAuth';
import { consumirMotivoSaida, mensagemDoErro } from '../lib/api';
import Erro from '../components/Erro';
import BotaoCta from '../components/ui/BotaoCta';
import RotuloSecao from '../components/ui/RotuloSecao';
import Segmentado from '../components/ui/Segmentado';

type Aba = 'entrar' | 'cadastrar';

interface PropsCampo {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  tipo?: 'text' | 'email' | 'password';
  autoComplete: string;
  aviso?: string;
}

function CampoSublinhado({ rotulo, valor, aoMudar, tipo = 'text', autoComplete, aviso }: PropsCampo) {
  const [revelada, setRevelada] = useState(false);
  const senha = tipo === 'password';
  return (
    <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <RotuloSecao sx={{ letterSpacing: '.14em' }}>{rotulo}</RotuloSecao>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 48,
          borderBottom: '1.6px solid',
          borderColor: valor === '' ? 'neutro.borda' : 'text.primary',
          transition: 'border-color .2s',
          '&:focus-within': { borderColor: 'text.primary' },
        }}
      >
        <InputBase
          fullWidth
          type={senha && revelada ? 'text' : tipo}
          value={valor}
          autoComplete={autoComplete}
          onChange={(evento) => aoMudar(evento.target.value)}
          sx={{
            fontWeight: 500,
            fontSize: 16,
            ...(senha && !revelada && valor !== '' && { letterSpacing: '.2em', fontSize: 18 }),
          }}
        />
        {senha && (
          <ButtonBase
            aria-label={revelada ? 'ocultar senha' : 'mostrar senha'}
            aria-pressed={revelada}
            onClick={() => setRevelada((antes) => !antes)}
            sx={{ minHeight: 32, px: 1, fontFamily: 'inherit', fontSize: 12, color: 'text.secondary' }}
          >
            {revelada ? 'ocultar' : 'ver'}
          </ButtonBase>
        )}
      </Box>
      {aviso !== undefined && (
        <Typography component="span" sx={{ fontSize: 12, color: 'error.main' }}>
          {aviso}
        </Typography>
      )}
    </Box>
  );
}

export default function Login() {
  const { entrar, cadastrar, carregando } = useAuth();
  const [aba, setAba] = useState<Aba>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [repetida, setRepetida] = useState('');
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (carregando) return;
    const motivo = consumirMotivoSaida();
    if (motivo !== null) setErro(motivo);
  }, [carregando]);

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

  function trocarAba(nova: Aba) {
    setAba(nova);
    setErro(null);
    setRepetida('');
  }

  return (
    <Box
      component="main"
      sx={{
        maxWidth: 480,
        mx: 'auto',
        minHeight: '100dvh',
        p: '44px 26px 26px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '32px',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
        <RotuloSecao sx={{ fontSize: 10 }}>dieta preguiçoso</RotuloSecao>
        <Typography
          component="h1"
          sx={{ m: 0, fontWeight: 800, fontSize: 50, lineHeight: 0.94, letterSpacing: '-.035em' }}
        >
          Foto,
          <br />
          áudio ou
          <br />
          texto.
          <br />
          <Box component="span" sx={{ color: 'primary.vivo' }}>
            O resto é
            <br />
            com a gente.
          </Box>
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={(evento: React.FormEvent) => void enviar(evento)}
        sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}

        {cadastrando && (
          <CampoSublinhado rotulo="nome" valor={nome} aoMudar={setNome} autoComplete="name" />
        )}
        <CampoSublinhado rotulo="e-mail" tipo="email" valor={email} aoMudar={setEmail} autoComplete="email" />
        <CampoSublinhado
          rotulo="senha"
          tipo="password"
          valor={senha}
          aoMudar={setSenha}
          autoComplete={cadastrando ? 'new-password' : 'current-password'}
          aviso={senhaCurta ? 'mínimo de 8 caracteres' : undefined}
        />
        {cadastrando && (
          <CampoSublinhado
            rotulo="confirmar senha"
            tipo="password"
            valor={repetida}
            aoMudar={setRepetida}
            autoComplete="new-password"
            aviso={senhasDiferentes ? 'as senhas não são iguais' : undefined}
          />
        )}

        <Segmentado<Aba>
          rotulo="entrar ou cadastrar"
          estilo="login"
          valor={aba}
          aoMudar={trocarAba}
          opcoes={[
            { valor: 'entrar', rotulo: 'entrar' },
            { valor: 'cadastrar', rotulo: 'cadastrar' },
          ]}
        />

        <BotaoCta type="submit" disabled={!podeEnviar}>
          {enviando ? 'aguarde...' : cadastrando ? 'criar conta' : 'entrar'}
        </BotaoCta>
      </Box>
    </Box>
  );
}
