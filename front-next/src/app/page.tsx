import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const email = cookieStore.get('user_email')?.value;

  return (
    <div className="home">
      {email ? (
        <h1>Logado com {email}</h1>
      ) : (
        <>
          <h1>Boas vindas</h1>
          <a href="/api/auth/login" className="btn-primary">Entrar</a>
        </>
      )}
    </div>
  );
}
