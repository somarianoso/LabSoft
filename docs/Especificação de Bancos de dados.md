# **WELLFLIX**
Atleta - Sophia

| Nome | CPF | Email | ID Assinatura | ID Video | ID Seguidos | ID Trilha |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
|  |  |  |  | Lista | *Lista* | *Lista* |

  
Profissional - Gabriel

| Nome | Categorias | Email | CPF | ID Vídeo | Seguidores ID |
| :---- | :---- | :---- | :---- | :---- | :---- |
| *String* | *Lista Strings* | *String* | *String* | *Lista String* | *Lista String* |

\-- Tabela principal  
CREATE TABLE Profissional (  
    cpf VARCHAR(14) NOT NULL,  
    nome VARCHAR(100) NOT NULL,  
    email VARCHAR(100) NOT NULL,

    PRIMARY KEY (cpf)  
);

\-- Categorias do profissional  
CREATE TABLE Profissional\_Categorias (  
    cpf VARCHAR(14) NOT NULL,  
    categoria VARCHAR(100) NOT NULL,

    PRIMARY KEY (cpf, categoria),

    FOREIGN KEY (cpf)  
        REFERENCES Profissional(cpf)  
);

\-- IDs dos vídeos do profissional  
CREATE TABLE Profissional\_Videos (  
    cpf VARCHAR(14) NOT NULL,  
    id\_video VARCHAR(100) NOT NULL,

    PRIMARY KEY (cpf, id\_video),

    FOREIGN KEY (cpf)  
        REFERENCES Profissional(cpf)  
);

\-- IDs dos seguidores do profissional  
CREATE TABLE Profissional\_Seguidores (  
    cpf VARCHAR(14) NOT NULL,  
    seguidor\_id VARCHAR(100) NOT NULL,

    PRIMARY KEY (cpf, seguidor\_id),

    FOREIGN KEY (cpf)  
        REFERENCES Profissional(cpf)  
);

Vídeo - Luís

| ID Video | Título | ID Profissional | Categorias | Descrição | Status | Conteúdo | Duração | Comentários | Avaliações |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| *String* | *String* | *String* | *Lista String* | *String* | *String* | *video ?* | *tempo ?* | *Lista Json ?* | *Lista Json ?*  |

  
Moderador - Gabriel

| Nome | CPF | Email |
| :---- | :---- | :---- |
| *String* | *String* | *String* |

CREATE TABLE Moderador (  
    cpf VARCHAR(14) NOT NULL,  
    nome VARCHAR(100) NOT NULL,  
    email VARCHAR(100) NOT NULL,  
    PRIMARY KEY (cpf)  
);

Assinatura - Maria Eduarda

| ID Assinatura | MetodoPagamento | ID Atleta | Categorias | Data de início | Data de vencimento |
| :---- | :---- | :---- | :---- | :---- | :---- |
|  |  |  | *Lista* |  |  |

Trilhas - Maria Eduarda

| ID trilha | Nome | Progresso | ID Vídeos | ID Atleta | Privacidade |
| :---- | :---- | :---- | :---- | :---- | :---- |
|  |  |  | *Lista* |  |  |

