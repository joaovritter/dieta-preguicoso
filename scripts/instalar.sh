#!/usr/bin/env bash
#
# Instala ou atualiza o dieta-preguicoso nesta VPS.
#
#   OPENAI_API_KEY=sk-... DOMINIO=dieta.trainna.com.br bash scripts/instalar.sh
#
# Sem DOMINIO, sobe só em http://IP:8080, sem HTTPS.
#
# Pode rodar quantas vezes quiser: não troca segredo que já existe, não duplica
# regra de firewall e não derruba o que já está no ar. De propósito ele NÃO roda
# `ufw enable` — ligar firewall no meio de uma sessão SSH é um jeito conhecido de
# ficar trancado do lado de fora. As regras ficam prontas; você liga quando quiser.

set -euo pipefail
cd "$(dirname "$0")/.."

msg() { printf '\n== %s\n' "$*"; }
aviso() { printf '\n!! %s\n' "$*"; }
erro() { printf '\nERRO: %s\n' "$*" >&2; exit 1; }

[ -f docker-compose.yml ] || erro 'rode de dentro da pasta do projeto'

# ---------------------------------------------------------------- .env

definir() { # definir CHAVE VALOR
  local escapado
  escapado=$(printf '%s' "$2" | sed -e 's/[&|\\]/\\&/g')
  if grep -q "^$1=" .env; then
    sed -i "s|^$1=.*|$1=${escapado}|" .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

valor_de() { sed -n "s|^$1=||p" .env | head -1; }

if [ ! -f .env ]; then
  cp .env.example .env
  msg '.env criado a partir do .env.example'
fi

# Segredos só são sorteados enquanto ainda forem o texto de exemplo.
case "$(valor_de POSTGRES_PASSWORD)" in
  '' | troque-esta-senha) definir POSTGRES_PASSWORD "$(openssl rand -hex 16)" ;;
esac
case "$(valor_de JWT_SECRET)" in
  '' | troque-por-um-hex-de-64-caracteres) definir JWT_SECRET "$(openssl rand -hex 32)" ;;
esac

[ -n "${OPENAI_API_KEY:-}" ] && definir OPENAI_API_KEY "$OPENAI_API_KEY"
case "$(valor_de OPENAI_API_KEY)" in
  '' | 'sk-...') erro 'falta a chave da OpenAI: rode com OPENAI_API_KEY=sk-... bash scripts/instalar.sh' ;;
esac

# A rede social depende de os amigos conseguirem criar conta.
definir PERMITIR_CADASTRO true

DOMINIO=${DOMINIO:-$(valor_de DOMINIO)}
if [ -n "$DOMINIO" ]; then
  definir DOMINIO "$DOMINIO"
  definir BIND_PUBLICO 127.0.0.1   # só o Caddy alcança o app
  definir TRUST_PROXY 2            # Caddy -> nginx -> API
else
  definir BIND_PUBLICO 0.0.0.0
  definir TRUST_PROXY 1
fi

PORTA=$(valor_de PORTA_PUBLICA); PORTA=${PORTA:-8080}

# ---------------------------------------------------------------- docker

if ! command -v docker >/dev/null; then
  msg 'instalando o docker'
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || erro 'docker compose não está disponível nesta máquina'

# ---------------------------------------------------------------- portas e firewall

porta_ocupada() { ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$1$"; }
caddy_no_ar() { docker compose ps --services --status running 2>/dev/null | grep -qx caddy; }

if [ -n "$DOMINIO" ] && ! caddy_no_ar; then
  for p in 80 443; do
    if porta_ocupada "$p"; then
      erro "a porta $p já está ocupada nesta VPS (outro servidor web?).
  Veja 'Se o trainna.com.br já roda nesta mesma VPS' em docs/deploy.md."
    fi
  done
fi

if command -v ufw >/dev/null; then
  ufw allow ssh >/dev/null 2>&1 || true
  if [ -n "$DOMINIO" ]; then
    ufw allow 80,443/tcp >/dev/null 2>&1 || true
    ufw delete allow "$PORTA/tcp" >/dev/null 2>&1 || true
  else
    ufw allow "$PORTA/tcp" >/dev/null 2>&1 || true
  fi
  msg 'regras de firewall prontas (o ufw continua como estava; ligue com `ufw enable`)'
fi

# ---------------------------------------------------------------- subir

if [ -n "$DOMINIO" ]; then
  msg "subindo com HTTPS em $DOMINIO (a primeira vez demora, é build)"
  docker compose --profile https up -d --build
else
  msg 'subindo sem HTTPS (a primeira vez demora, é build)'
  docker compose up -d --build
fi

msg 'esperando a API responder'
for _ in $(seq 40); do
  curl -fsS "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1 && break
  sleep 3
done
curl -fsS "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1 \
  || erro "a API não respondeu. Veja o log: docker compose logs --tail 40 backend"
echo 'API no ar.'

if [ -z "$DOMINIO" ]; then
  msg "pronto: http://$(curl -4 -fsS ifconfig.me 2>/dev/null || echo SEU_IP):$PORTA"
  exit 0
fi

msg "esperando o certificado do Let's Encrypt (até 2 minutos)"
for _ in $(seq 24); do
  curl -fsS "https://$DOMINIO/api/health" >/dev/null 2>&1 && break
  sleep 5
done

if curl -fsS "https://$DOMINIO/api/health" >/dev/null 2>&1; then
  msg "pronto: https://$DOMINIO"
else
  aviso "o app subiu, mas o HTTPS ainda não respondeu. Quase sempre é DNS:
  confira se 'dig +short $DOMINIO' devolve o IP desta VPS e se a nuvem do
  Cloudflare está CINZA (DNS only). O Caddy tenta de novo sozinho; acompanhe com:
  docker compose logs -f caddy"
fi
