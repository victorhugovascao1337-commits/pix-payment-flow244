# Configuração de Variáveis de Ambiente

Este arquivo contém as instruções para configurar as variáveis de ambiente necessárias para o projeto.

## Arquivo .env.local

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Coldfy API Credentials
COLDFY_SECRET_KEY=sk_live_exemplo_token
COLDFY_COMPANY_ID=16c5bbbc-807a-4a09-bde0-e8b469ca0db6

# UTMFY API Credentials
# Configure com seus tokens do UTMFY
UTMIFY_API_TOKEN=seu_token_aqui
NEXT_PUBLIC_UTMIFY_TOKEN=seu_token_publico_aqui

# Facebook Pixel ID
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=26395320700052288
```

## Variáveis Configuradas

### ✅ Coldfy (Já Configurado)
- `COLDFY_SECRET_KEY`: Credencial para autenticação na API Coldfy
- `COLDFY_COMPANY_ID`: ID da empresa na plataforma Coldfy

### ✅ UTMFY (Parcelmente Configurado)
- `UTMIFY_API_TOKEN`: Token de API para envio de eventos ao UTMFY (opcional - para eventos server-side)
- `NEXT_PUBLIC_UTMIFY_TOKEN`: Token público para scripts client-side (opcional)
- **Pixel ID**: 698acbb18b2628d6aab9e885 (já configurado no código)

### ✅ Facebook Pixel (Já Configurado)
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`: 26395320700052288

## Como Obter as Credenciais

### UTMFY
✅ **Pixel ID já configurado!** ID: 698acbb18b2628d6aab9e885

Para configurar os tokens de API (opcional):
1. Acesse o dashboard do UTMFY: https://app.utmify.com.br
2. Vá em Configurações > API
3. Copie o token de API e o token público (se necessário para eventos server-side)

### Facebook Pixel
✅ **Já configurado!** Pixel ID: 26395320700052288

## Importante

⚠️ **NUNCA** commite o arquivo `.env.local` no Git. Ele já está no `.gitignore` por segurança.

## Reiniciar o Servidor

Após configurar as variáveis de ambiente, reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

