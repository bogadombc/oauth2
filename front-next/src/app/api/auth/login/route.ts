import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function GET() {

  // PREPARANDO PARAMETROS PARA O FLUXO PKCE

  // Gerar um codigo de verificacao (verifier) e um desafio (challenge) para o PKCE
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

  // Gerar um state aleatorio para proteger contra CSRF
  const state = crypto.randomBytes(16).toString('base64url');

  // Armazenar o verifier e o state em cookies httpOnly para serem usados na callback.  
  // O parâmetro sameSite: 'lax' significa que, quando o AS redirecionar de volta para 
  // a callback, os cookies serão enviados na requisição, desde que seja via navegação 
  // top-level cross-site (redirect 302 com GET na barra de endereços).
  const cookieStore = await cookies();
  cookieStore.set('pkce_verifier', verifier, { httpOnly: true, sameSite: 'lax', path: '/' });
  cookieStore.set('oauth_state', state, { httpOnly: true, sameSite: 'lax', path: '/' });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: 'nextjs-client',
    redirect_uri: 'http://localhost:3000/api/auth/callback/spring',
    scope: 'openid',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  redirect(`http://localhost:9000/oauth2/authorize?${params}`);
}
