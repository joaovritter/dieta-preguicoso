#!/usr/bin/env bash
#
# Publica o app num subdomínio quando a VPS JÁ tem um nginx servindo outros sites
# (é o caso quando as portas 80/443 estão ocupadas e o perfil `https` do compose
# não pode subir).
#
#   DOMINIO=dieta.trainna.com.br bash scripts/subdominio-nginx.sh
#
# Se a VPS já tem um certificado que cobre o subdomínio (um Origin Certificate
# curinga do Cloudflare, por exemplo), reaproveite em vez de pedir outro:
#
#   DOMINIO=dieta.trainna.com.br \
#   CERT=/etc/ssl/cloudflare/trainna.pem CHAVE=/etc/ssl/cloudflare/trainna.key \
#   TRUST_PROXY=3 bash scripts/subdominio-nginx.sh
#
# TRUST_PROXY conta quantos proxies ficam na frente da API, porque o limite de
# tentativas de login é por IP: 2 com o Cloudflare em DNS only (nuvem cinza),
# 3 com o Cloudflare proxiando (nuvem laranja), que entra como mais um salto.
#
# O que ele faz: cria UM arquivo novo em sites-available, testa a configuração,
# recarrega o nginx e resolve o certificado. Nunca edita vhost que já existe —
# se o arquivo do subdomínio já estiver lá, ele para e avisa.

set -euo pipefail
cd "$(dirname "$0")/.."

msg() { printf '\n== %s\n' "$*"; }
erro() { printf '\nERRO: %s\n' "$*" >&2; exit 1; }

[ -f docker-compose.yml ] || erro 'rode de dentro da pasta do projeto'
[ "$(id -u)" = 0 ] || erro 'precisa ser root (o nginx do sistema é quem vai servir o subdomínio)'

DOMINIO=${DOMINIO:-}
[ -n "$DOMINIO" ] || erro 'faltou o domínio: DOMINIO=dieta.trainna.com.br bash scripts/subdominio-nginx.sh'

command -v nginx >/dev/null || erro 'não achei o nginx aqui. Se o que serve os outros sites
  for Apache, Caddy ou o próprio Node, me diga qual antes de seguir.'

PORTA=$(sed -n 's|^PORTA_PUBLICA=||p' .env 2>/dev/null | head -1)
PORTA=${PORTA:-8080}
ARQUIVO=/etc/nginx/sites-available/$DOMINIO

[ -e "$ARQUIVO" ] && erro "$ARQUIVO já existe. Confira o conteúdo e apague se quiser refazer."

# ---- o app passa a escutar só no localhost; quem fala com a internet é o nginx
definir() {
  local escapado
  escapado=$(printf '%s' "$2" | sed -e 's/[&|\\]/\\&/g')
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=${escapado}|" .env
  else printf '%s=%s\n' "$1" "$2" >> .env; fi
}
[ -f .env ] || erro 'não achei o .env. Rode antes: bash scripts/instalar.sh'
definir BIND_PUBLICO 127.0.0.1
definir TRUST_PROXY "${TRUST_PROXY:-2}"   # nginx do sistema -> nginx do compose -> API

CERT=${CERT:-}
CHAVE=${CHAVE:-}
if [ -n "$CERT" ] || [ -n "$CHAVE" ]; then
  [ -n "$CERT" ] && [ -n "$CHAVE" ] || erro 'informe CERT e CHAVE juntos'
  [ -r "$CERT" ] || erro "não consegui ler o certificado: $CERT"
  [ -r "$CHAVE" ] || erro "não consegui ler a chave: $CHAVE"
fi

msg "escrevendo $ARQUIVO"

# O corpo é igual nos dois casos; só muda se ele mora num server de 80 ou de 443.
corpo() {
  cat <<NGINX
  # As fotos das refeições passam por aqui; o padrão do nginx (1M) barraria.
  client_max_body_size 30m;

  location / {
    proxy_pass http://127.0.0.1:$PORTA;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    # A IA pode levar dezenas de segundos para responder sobre uma foto.
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;
  }
NGINX
}

if [ -n "$CERT" ]; then
  # Certificado que já existe na máquina: o vhost já nasce em HTTPS.
  {
    printf 'server {\n  listen 80;\n  listen [::]:80;\n  server_name %s;\n  return 301 https://$host$request_uri;\n}\n\n' "$DOMINIO"
    printf 'server {\n  listen 443 ssl;\n  listen [::]:443 ssl;\n  http2 on;\n  server_name %s;\n\n' "$DOMINIO"
    printf '  ssl_certificate %s;\n  ssl_certificate_key %s;\n\n' "$CERT" "$CHAVE"
    corpo
    printf '}\n'
  } > "$ARQUIVO"
else
  # Sem certificado ainda: sobe em HTTP e o certbot converte para HTTPS depois.
  {
    printf 'server {\n  listen 80;\n  listen [::]:80;\n  server_name %s;\n\n' "$DOMINIO"
    corpo
    printf '}\n'
  } > "$ARQUIVO"
fi

ln -sf "$ARQUIVO" "/etc/nginx/sites-enabled/$DOMINIO"

msg 'testando a configuração do nginx (os outros sites não são tocados)'
if ! nginx -t; then
  rm -f "/etc/nginx/sites-enabled/$DOMINIO" "$ARQUIVO"
  erro 'a configuração não passou no teste. Desfiz o que criei; nada mudou nos outros sites.'
fi
systemctl reload nginx

msg 'subindo o app só no localhost'
docker compose up -d --build

msg 'esperando a API responder'
for _ in $(seq 40); do
  curl -fsS "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1 && break
  sleep 3
done
curl -fsS "http://127.0.0.1:$PORTA/api/health" >/dev/null 2>&1 \
  || erro "a API não respondeu. Veja: docker compose logs --tail 40 backend"

if [ -n "$CERT" ]; then
  msg "pronto: https://$DOMINIO"
  exit 0
fi

if ! command -v certbot >/dev/null && command -v apt-get >/dev/null; then
  msg 'instalando o certbot'
  apt-get update -qq && apt-get install -y -qq certbot python3-certbot-nginx
fi

if command -v certbot >/dev/null; then
  msg 'pedindo o certificado'
  certbot --nginx -d "$DOMINIO" --non-interactive --agree-tos --register-unsafely-without-email --redirect \
    || erro "o certbot falhou. Quase sempre é DNS ou nuvem laranja no Cloudflare:
  'dig +short $DOMINIO' precisa devolver o IP desta VPS."
  msg "pronto: https://$DOMINIO"
else
  msg "o app já responde em http://$DOMINIO, mas ainda sem certificado."
fi
