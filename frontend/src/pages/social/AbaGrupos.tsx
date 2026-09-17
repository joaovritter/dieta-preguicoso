import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import InputBase from '@mui/material/InputBase';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import BotaoTracejado from '../../components/social/BotaoTracejado';
import { api, mensagemDoErro } from '../../lib/api';
import { membros, textoRanking } from '../../lib/social';
import type { Grupo } from '../../lib/types';

type Formulario = 'criar' | 'entrar' | null;

const campoSx = {
  flex: 1,
  minHeight: 46,
  px: '12px',
  border: '1.4px solid',
  borderColor: 'neutro.borda',
  borderRadius: '12px',
  fontSize: 14,
} as const;

export default function AbaGrupos() {
  const [grupos, setGrupos] = useState<Grupo[] | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setGrupos((await api.grupos()).grupos);
      setErro(null);
    } catch (falha: unknown) {
      setErro(mensagemDoErro(falha));
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const texto = valor.trim();
    if (texto === '' || formulario === null) return;
    setOcupado(true);
    (formulario === 'criar' ? api.criarGrupo(texto) : api.entrarNoGrupo(texto))
      .then(async () => {
        setValor('');
        setFormulario(null);
        await carregar();
      })
      .catch((falha: unknown) => setErro(mensagemDoErro(falha)))
      .finally(() => setOcupado(false));
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {erro !== null && (
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      )}

      {grupos === null ? (
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>carregando...</Typography>
      ) : (
        <>
          {grupos.length === 0 && (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>nenhum grupo ainda</Typography>
          )}
          {grupos.map((grupo) => {
            const ranking = textoRanking(grupo.minha_posicao_semana);
            return (
              <Box
                key={grupo.id}
                component={Link}
                to={`/grupos/${grupo.id}`}
                sx={[
                  {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    p: '14px',
                    borderRadius: '14px',
                    bgcolor: 'neutro.cartao',
                    color: 'inherit',
                    textDecoration: 'none',
                  },
                  (t) => t.applyStyles('dark', { border: '1px solid', borderColor: t.vars?.palette.neutro.borda }),
                ]}
              >
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{grupo.nome}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{membros(grupo.quantidade_membros)}</Typography>
                {ranking !== null && (
                  <Typography sx={{ fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}>{ranking}</Typography>
                )}
              </Box>
            );
          })}

          {formulario === null ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <BotaoTracejado onClick={() => setFormulario('criar')}>+ criar grupo</BotaoTracejado>
              <ButtonBase
                onClick={() => setFormulario('entrar')}
                sx={{ mt: '4px', minHeight: 44, fontFamily: 'inherit', fontWeight: 600, fontSize: 12.5, color: 'primary.main' }}
              >
                entrar com código
              </ButtonBase>
            </Box>
          ) : (
            <Box component="form" onSubmit={enviar} sx={{ display: 'flex', gap: '8px', mt: '4px' }}>
              <InputBase
                autoFocus
                value={valor}
                onChange={(e) => setValor(formulario === 'entrar' ? e.target.value.toUpperCase() : e.target.value)}
                placeholder={formulario === 'criar' ? 'nome do grupo' : 'K3F9QZ'}
                inputProps={{
                  'aria-label': formulario === 'criar' ? 'nome do grupo novo' : 'código de convite',
                  maxLength: formulario === 'criar' ? 60 : 12,
                }}
                sx={campoSx}
              />
              <Button type="submit" variant="contained" disabled={ocupado} sx={{ borderRadius: '12px' }}>
                {formulario === 'criar' ? 'criar' : 'entrar'}
              </Button>
              <ButtonBase
                onClick={() => {
                  setFormulario(null);
                  setValor('');
                }}
                sx={{ fontFamily: 'inherit', fontSize: 12.5, color: 'text.secondary', px: '6px' }}
              >
                cancelar
              </ButtonBase>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
