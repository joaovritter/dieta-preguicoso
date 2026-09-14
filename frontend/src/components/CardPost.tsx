import { Link } from 'react-router-dom';
import { NOME_REFEICAO, horaDoTimestamp, numero } from '../lib/format';
import type { Post } from '../lib/types';

export default function CardPost({ post }: { post: Post }) {
  return (
    <article className="cartao post">
      <header className="post-topo">
        <Link className="post-autor" to={`/u/${post.autor.id}`}>
          {post.autor.nome_tag}
        </Link>
        <span className="post-quando num">
          {NOME_REFEICAO[post.refeicao]} · {horaDoTimestamp(post.criado_em)}
        </span>
      </header>

      {post.midia_url !== null && (
        <img
          className="post-foto"
          src={post.midia_url}
          alt={`foto de ${post.descricao_bruta}`}
          loading="lazy"
        />
      )}

      <p className="post-descricao">{post.descricao_bruta}</p>

      <p className="post-kcal num">{numero(post.calorias_total)} kcal</p>
      <p className="post-macros num">
        C {numero(post.carboidrato_total_g)} · P {numero(post.proteina_total_g)} · G{' '}
        {numero(post.gordura_total_g)}
      </p>
    </article>
  );
}
