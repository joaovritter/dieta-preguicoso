import { useState } from 'react';
import type { FormEvent } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { api, definirMotivoSaida, mensagemDoErro } from '../../lib/api';
import Erro from '../Erro';
import BotaoCta from '../ui/BotaoCta';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
}

export default function DialogoDesativarConta({ aberto, aoFechar }: Props) {
  const { sair } = useAuth();
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [desativando, setDesativando] = useState(false);

  function fechar() {
    if (desativando) return;
    setSenha('');
    setErro(null);
    aoFechar();
  }

  async function desativar(evento: FormEvent) {
    evento.preventDefault();
    if (senha === '') return setErro('informe a senha');
    setDesativando(true);
    setErro(null);
    try {
      await api.desativarConta(senha);
      definirMotivoSaida('sua conta foi desativada. para voltar, fale com o administrador');
      sair();
      navigate('/login', { replace: true });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setDesativando(false);
    }
  }

  return (
    <Dialog
      open={aberto}
      onClose={fechar}
      slotProps={{
        paper: {
          sx: { borderRadius: '20px', p: '22px', m: '22px', bgcolor: 'background.default', backgroundImage: 'none' },
        },
      }}
    >
      <Box
        component="form"
        onSubmit={(evento: FormEvent) => void desativar(evento)}
        sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>desativar conta</Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.45, color: 'text.secondary' }}>
          sua conta fica desativada: você não consegue mais entrar e some para amigos e grupos. nada é apagado.
          para voltar, fale com o administrador.
        </Typography>
        {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
        <TextField
          label="sua senha"
          type="password"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 200 } }}
        />
        <Box sx={{ display: 'flex', gap: '9px' }}>
          {/* Cancelar vem primeiro e leva o foco: Enter afobado não desativa nada. */}
          <BotaoCta variante="contorno" autoFocus disabled={desativando} onClick={fechar} sx={{ flex: 1 }}>
            cancelar
          </BotaoCta>
          <BotaoCta
            type="submit"
            variante="primario"
            disabled={desativando}
            sx={{ flex: 1, bgcolor: 'error.main', '&:hover': { bgcolor: 'error.main', filter: 'brightness(.92)' } }}
          >
            {desativando ? 'desativando...' : 'desativar'}
          </BotaoCta>
        </Box>
      </Box>
    </Dialog>
  );
}
