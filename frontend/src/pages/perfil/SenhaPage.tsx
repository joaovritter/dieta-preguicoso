import { useState } from 'react';
import type { FormEvent } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useNavigate } from 'react-router-dom';
import { api, mensagemDoErro } from '../../lib/api';
import { validarNovaSenha } from '../../lib/senha';
import SubTela from '../../components/perfil/SubTela';
import BotaoCta from '../../components/ui/BotaoCta';
import Erro from '../../components/Erro';

const ID_FORM = 'form-trocar-senha';
const limite = { htmlInput: { maxLength: 200 } };

export default function SenhaPage() {
  const navigate = useNavigate();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (atual === '') return setErro('informe a senha atual');
    const invalida = validarNovaSenha(nova, confirmacao);
    if (invalida !== null) return setErro(invalida);

    setSalvando(true);
    setErro(null);
    try {
      await api.trocarSenha(atual, nova);
      navigate('/configuracoes', { replace: true });
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
      setSalvando(false);
    }
  }

  return (
    <SubTela
      titulo="trocar senha"
      voltarPara="/configuracoes"
      rodape={
        <BotaoCta type="submit" form={ID_FORM} disabled={salvando}>
          {salvando ? 'salvando...' : 'salvar senha'}
        </BotaoCta>
      }
    >
      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
      <Box
        component="form"
        id={ID_FORM}
        onSubmit={(evento: FormEvent) => void salvar(evento)}
        sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <TextField
          label="senha atual"
          type="password"
          autoFocus
          autoComplete="current-password"
          value={atual}
          onChange={(e) => setAtual(e.target.value)}
          slotProps={limite}
        />
        <TextField
          label="senha nova"
          type="password"
          autoComplete="new-password"
          value={nova}
          onChange={(e) => setNova(e.target.value)}
          helperText="pelo menos 8 caracteres"
          slotProps={limite}
        />
        <TextField
          label="confirmar senha nova"
          type="password"
          autoComplete="new-password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          slotProps={limite}
        />
      </Box>
    </SubTela>
  );
}
