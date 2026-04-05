```mermaid
sequenceDiagram
    actor U as Usuário
    participant B as Browser
    participant N as Next.js<br/>(localhost:3000)
    participant AS as Authorization Server<br/>(localhost:9000)

    U->>B: Clica em "Entrar"
    B->>N: GET /api/auth/login

    Note over N: Gera code_verifier (32 bytes aleatórios)<br/>Calcula code_challenge = SHA-256(verifier)<br/>Gera state (16 bytes aleatórios)
    N->>B: Set-Cookie: pkce_verifier, oauth_state (HttpOnly)
    N->>B: 302 → /oauth2/authorize?response_type=code<br/>&client_id=nextjs-client<br/>&redirect_uri=.../callback/spring<br/>&scope=openid<br/>&state=...&code_challenge=...&code_challenge_method=S256

    B->>AS: GET /oauth2/authorize?...
    AS->>B: 302 → /login (tela de login do AS)
    B->>U: Exibe formulário de login

    U->>B: Preenche e-mail + senha e submete
    B->>AS: POST /login (username, password)

    Note over AS: Autentica o usuário via<br/>InMemoryUserDetailsManager
    Note over AS: Valida code_challenge<br/>Gera authorization code

    AS->>B: 302 → /api/auth/callback/spring?code=...&state=...

    B->>N: GET /api/auth/callback/spring?code=...&state=...
    Note over N: Lê pkce_verifier e oauth_state dos cookies<br/>Valida state recebido === state salvo

    N->>AS: POST /oauth2/token<br/>Authorization: Basic (client_id:secret)<br/>grant_type=authorization_code<br/>code=...&code_verifier=...&redirect_uri=...

    Note over AS: Valida authorization code<br/>Verifica code_verifier contra code_challenge
    AS->>N: { access_token, id_token, ... }

    Note over N: Decodifica id_token (JWT)<br/>Extrai claim "sub" (e-mail do usuário)<br/>Apaga cookies pkce_verifier e oauth_state<br/>Define cookie user_email (HttpOnly)
    N->>B: Delete-Cookie: pkce_verifier, oauth_state<br/>Set-Cookie: user_email (HttpOnly)<br/>302 → /

    B->>N: GET /
    Note over N: Lê cookie user_email
    N->>B: Página "Logado com maria@example.com"
    B->>U: Exibe "Logado com maria@example.com"
```

---

```mermaid
sequenceDiagram
    actor U as Usuário
    participant B as Browser
    participant N as Next.js<br/>(localhost:3000)
    participant AS as Authorization Server<br/>(localhost:9000)

    U->>B: Clica em "Entrar"

    B->>N: GET http://localhost:3000/api/auth/login

    N->>B: HTTP/1.1 302 Found<br/>Set-Cookie: pkce_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk#59; HttpOnly#59; SameSite=Lax<br/>Set-Cookie: oauth_state=rT2hJ9kLmN4pQwXv#59; HttpOnly#59; SameSite=Lax<br/>Location: http://localhost:9000/oauth2/authorize?response_type=code<br/>&client_id=nextjs-client<br/>&redirect_uri=http://localhost:3000/api/auth/callback/spring<br/>&scope=openid<br/>&state=rT2hJ9kLmN4pQwXv<br/>&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM<br/>&code_challenge_method=S256

    B->>AS: GET http://localhost:9000/oauth2/authorize?response_type=code<br/>&client_id=nextjs-client<br/>&redirect_uri=http://localhost:3000/api/auth/callback/spring<br/>&scope=openid<br/>&state=rT2hJ9kLmN4pQwXv<br/>&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM<br/>&code_challenge_method=S256

    AS->>B: HTTP/1.1 302 Found<br/>Location: http://localhost:9000/login

    B->>AS: GET http://localhost:9000/login
    AS->>B: HTTP/1.1 200 OK (HTML — formulário de login)
    B->>U: Exibe formulário de login

    U->>B: Preenche e-mail + senha e submete

    B->>AS: POST http://localhost:9000/login<br/>Content-Type: application/x-www-form-urlencoded<br/><br/>username=maria%40example.com&password=12345678

    AS->>B: HTTP/1.1 302 Found<br/>Location: http://localhost:3000/api/auth/callback/spring?code=jx8KpLmN2qRtUvWx&state=rT2hJ9kLmN4pQwXv

    B->>N: GET http://localhost:3000/api/auth/callback/spring?code=jx8KpLmN2qRtUvWx&state=rT2hJ9kLmN4pQwXv<br/>Cookie: pkce_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk#59; oauth_state=rT2hJ9kLmN4pQwXv

    N->>AS: POST http://localhost:9000/oauth2/token<br/>Authorization: Basic bmV4dGpzLWNsaWVudDpuZXh0anMtc2VjcmV0<br/>Content-Type: application/x-www-form-urlencoded<br/><br/>grant_type=authorization_code<br/>&code=jx8KpLmN2qRtUvWx<br/>&redirect_uri=http://localhost:3000/api/auth/callback/spring<br/>&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

    AS->>N: HTTP/1.1 200 OK<br/>Content-Type: application/json<br/><br/>{"access_token":"eyJhbGci...","id_token":"eyJhbGci...eyJzdWIiOiJtYXJpYUBleGFtcGxlLmNvbSJ9...","token_type":"Bearer","expires_in":300}

    N->>B: HTTP/1.1 302 Found<br/>Set-Cookie: pkce_verifier=#59; Max-Age=0<br/>Set-Cookie: oauth_state=#59; Max-Age=0<br/>Set-Cookie: user_email=maria@example.com#59; HttpOnly#59; SameSite=Lax<br/>Location: http://localhost:3000/

    B->>N: GET http://localhost:3000/<br/>Cookie: user_email=maria@example.com

    N->>B: HTTP/1.1 200 OK (HTML — "Logado com maria@example.com")
    B->>U: Exibe "Logado com maria@example.com"
```
