import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import Erro from '../components/Erro';
import EditorFotoPerfil from '../components/perfil/EditorFotoPerfil';
import { IconeEngrenagem } from '../components/tabbar/icones';
import Tela from '../components/ui/Tela';

export default function PerfilPage() {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  if (perfil === null) return null;

  return (
    <Tela gap={26}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px', pt: '4px' }}>
        <EditorFotoPerfil tamanho={58} aoFalhar={setErro} />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Typography component="h1" sx={{ m: 0, fontWeight: 700, fontSize: 17, overflowWrap: 'anywhere' }}>{perfil.nome}</Typography>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', overflowWrap: 'anywhere' }}>{perfil.email}</Typography>
        </Box>
        <ButtonBase
          onClick={() => navigate('/configuracoes')}
          aria-label="configurações"
          sx={{ minHeight: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}
        >
          <IconeEngrenagem />
        </ButtonBase>
      </Box>

      {erro !== null && <Erro mensagem={erro} aoFechar={() => setErro(null)} />}
    </Tela>
  );
}
