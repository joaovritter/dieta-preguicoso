import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import SecaoMetas from '../../components/SecaoMetas';
import SubTela from '../../components/perfil/SubTela';
import BotaoCta from '../../components/ui/BotaoCta';
import Erro from '../../components/Erro';
import { useFormularioPerfil } from './useFormularioPerfil';
import type { Perfil } from '../../lib/types';

function Formulario({ inicial }: { inicial: Perfil }) {
  const navigate = useNavigate();
  const { form, mudar, salvar, salvando, erro, limparErro } = useFormularioPerfil(inicial);
  return (
    <SubTela
      titulo="metas"
      voltarPara="/perfil"
      rodape={
        <BotaoCta disabled={salvando} onClick={() => void salvar().then((ok) => ok && navigate('/perfil'))}>
          {salvando ? 'salvando...' : 'salvar'}
        </BotaoCta>
      }
    >
      {erro !== null && <Erro mensagem={erro} aoFechar={limparErro} />}
      <SecaoMetas form={form} aoMudar={mudar} />
    </SubTela>
  );
}

export default function MetasPage() {
  const { perfil } = useAuth();
  return perfil === null ? null : <Formulario inicial={perfil} />;
}
