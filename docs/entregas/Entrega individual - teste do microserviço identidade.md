# Entrega individual — microserviço de identidade

**Aluna:** Sophia Soares Mariano
**NUSP:** 15511213

## Links

- **Frontend React:** <https://wellflix-frontend.onrender.com>
- **Backend FastAPI individual:** <https://wellflix-identidade-sophia.onrender.com>
- **Documentação da API:** <https://wellflix-identidade-sophia.onrender.com/docs>
- **Saúde:** <https://wellflix-identidade-sophia.onrender.com/health>

## Como validar pelo frontend

1. Abra o [WellFlix](https://wellflix-frontend.onrender.com) e selecione **Começar grátis**.
2. Crie uma conta de teste com nome fictício, CPF de teste com 11 dígitos, e-mail ainda não cadastrado e senha com pelo menos 8 caracteres. Não use dados pessoais reais.
3. Confirme que a interface mostra a mensagem de cadastro realizado com sucesso.
4. Selecione **Entrar**, informe o mesmo e-mail e senha e mantenha o perfil **Atleta**.
5. Confirme que o login retorna à página inicial e que o botão **Sair** aparece no cabeçalho.

O cadastro seguido de login valida que o frontend enviou os dados ao microserviço, que a conta foi persistida e que a senha informada é reconhecida. Uma senha incorreta deve ser recusada.

## Validação complementar da API

Em [Swagger](https://wellflix-identidade-sophia.onrender.com/docs), a rota `GET /api/atletas/me` exige autenticação. Faça login em `POST /api/auth/sessao`, autorize com o token retornado e execute a rota. Com token válido, a resposta deve ser `200` e mostrar o perfil correspondente; sem token, deve ser `401`.

`/health` confirma que o serviço está ativo. A chamada autenticada acima complementa o teste pelo frontend. Não é necessário acessar ou configurar o banco para realizar a demonstração.
