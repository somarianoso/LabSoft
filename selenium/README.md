# Testes Selenium

Cada história tem um arquivo independente:

- `test_historia_atleta_login_video.py`: login, pesquisa e reprodução da prévia.
- `test_historia_profissional_upload.py`: seleção e envio de vídeo para análise.
- `test_historia_comprar_plano.py`: escolha e checkout do plano Pro.
- `test_wellflix_signup.py`: cadastro válido e validações do formulário.

O helper `selenium_support.py` desacelera cliques e digitação e desenha um cursor
verde sobre a página para acompanhar as ações. O intervalo padrão é 0,8 segundo
por ação e pode ser ajustado com `SELENIUM_SLOW_MO`.

O repositório de referência do roteiro está clonado em `pcs3643_Risco/`; o
exemplo original está em `pcs3643_Risco/selenium/`.

## Executar

Na raiz do projeto, inicie o app:

```sh
npm install
npm run dev
```

Em outro terminal, instale Selenium e execute todos os fluxos Selenium:

```sh
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r selenium/requirements.txt
python -m unittest discover -s selenium -p 'test_*.py' -v
```

Esse comando executa as três histórias e os testes de cadastro. Para executar
somente as histórias, use `python -m unittest discover -s selenium -p
'test_historia_*.py' -v`. O teste separado `tests/test_moderator.py` não faz
parte desses comandos.

Para executar um único arquivo, use, por exemplo,
`python selenium/test_historia_comprar_plano.py`.
Para gravar a janela do Chrome, rode com `SELENIUM_HEADLESS=0`; aumente a pausa
com `SELENIUM_SLOW_MO=1.2`. O Chrome precisa de uma sessão gráfica nesse modo.

Selenium Manager localiza ou obtém o driver do Chrome na primeira execução.
Defina `WELLFLIX_URL` para apontar os testes a outro endereço. Login, reprodução,
envio e pagamento são demonstrações locais; não há autenticação, mídia ou
cobrança em um backend.