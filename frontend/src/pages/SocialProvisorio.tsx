import { useSearchParams } from 'react-router-dom';
import Amigos from './Amigos';
import Grupos from './Grupos';

/** Provisório: o plano D troca por Social.tsx (amigos · grupos · feed) e apaga este arquivo. */
export default function SocialProvisorio() {
  const [parametros] = useSearchParams();
  return parametros.get('aba') === 'grupos' ? <Grupos /> : <Amigos />;
}
