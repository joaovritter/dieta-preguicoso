import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { corDoPonto, textoDoDia } from '../../lib/social';
import type { PerfilPublico, ProgressoDia } from '../../lib/types';

interface Props {
  perfil: PerfilPublico;
  progresso: ProgressoDia;
  /** Ação opcional à direita (ex.: remover). */
  acao?: ReactNode;
}

/** Linha "avatar · nome · como foi o dia · bolinha" (design 08, aba amigos). */
export default function LinhaPessoa({ perfil, progresso, acao }: Props) {
  const texto = textoDoDia(progresso);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        py: '9px',
        borderTop: 1,
        borderColor: 'neutro.linha',
      }}
    >
      <Box
        component={Link}
        to={`/u/${perfil.id}`}
        aria-label={`${perfil.nome_tag} — ${texto}`}
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'inherit',
          textDecoration: 'none',
          minHeight: 44,
        }}
      >
        <Avatar nome={perfil.nome} tamanho={40} />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 14 }}>
            {perfil.nome}
          </Typography>
          <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
            {texto}
          </Typography>
        </Box>
        <Box
          aria-hidden="true"
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: corDoPonto(progresso.status), flex: 'none' }}
        />
      </Box>
      {acao}
    </Box>
  );
}
