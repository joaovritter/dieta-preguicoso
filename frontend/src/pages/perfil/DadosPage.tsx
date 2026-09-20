import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import SecaoDadosPessoais from '../../components/SecaoDadosPessoais';
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
      titulo="seus dados"
      voltarPara="/configuracoes"
      rodape={
        <BotaoCta disabled={salvando || form.nome.trim() === ''} onClick={() => void salvar().then((ok) => ok && navigate('/configuracoes'))}>
          {salvando ? 'salvando...' : 'salvar'}
        </BotaoCta>
      }
    >
      {erro !== null && <Erro mensagem={erro} aoFechar={limparErro} />}
      <SecaoDadosPessoais form={form} aoMudar={mudar} />
    </SubTela>
  );
}

export default function DadosPage() {
  const { perfil } = useAuth();
  return perfil === null ? null : <Formulario inicial={perfil} />;
}
