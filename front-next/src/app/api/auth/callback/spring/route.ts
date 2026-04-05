import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const verifier = cookieStore.get('pkce_verifier')?.value;

  // verificar se o código e o estado estão presentes e se o estado corresponde ao que foi salvo
  if (!code || !state || state !== savedState || !verifier) {
    return new Response('Authentication failed', { status: 400 });
  }

  const tokenResponse = await fetch('http://localhost:9000/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from('nextjs-client:nextjs-secret').toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:3000/api/auth/callback/spring',
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    return new Response('Token exchange failed', { status: 400 });
  }

  const tokens = await tokenResponse.json();
  const [, payloadB64] = (tokens.id_token as string).split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  cookieStore.delete('pkce_verifier');
  cookieStore.delete('oauth_state');
  cookieStore.set('user_email', payload.sub, { httpOnly: true, sameSite: 'lax', path: '/' });

  redirect('/');
}
