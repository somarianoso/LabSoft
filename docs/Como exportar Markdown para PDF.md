# Exportar Markdown para PDF

Foi preparada uma ferramenta local para converter os arquivos `.md` do projeto em PDF. Ela não altera o frontend nem os serviços do backend.

## Gerar um PDF

No terminal WSL/Linux, a partir da pasta raiz do repositório, execute:

```bash
~/.venvs/wellflix-md2pdf/bin/md2pdf \
  -i "docs/entregas/Entrega individual - teste do microserviço identidade.md" \
  -o "docs/entregas/Entrega individual - teste do microserviço identidade.pdf"
```

Troque os caminhos de `-i` (arquivo Markdown de origem) e `-o` (arquivo PDF de destino) para converter outro documento. O PDF pode então ser aberto e anexado à entrega.

## Instalar em outro ambiente

Requer Python 3.10 ou superior. Na raiz do repositório:

```bash
python3 -m venv ~/.venvs/wellflix-md2pdf
~/.venvs/wellflix-md2pdf/bin/python -m pip install -r docs/requirements-pdf.txt
```

O ambiente local usado neste computador já foi instalado. A lista de dependências está em [requirements-pdf.txt](requirements-pdf.txt). Em outros sistemas operacionais, o WeasyPrint pode exigir bibliotecas do sistema; consulte o [guia oficial de instalação](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation).
