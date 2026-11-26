CREATE TABLE IF NOT EXISTS cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone BIGINT NOT NULL UNIQUE,
    endereco VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS produto (
    id_produto SERIAL PRIMARY KEY,
    id_categoria INT REFERENCES categoria(id_categoria) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    preco DECIMAL(19, 2) NOT NULL,
    validade DATE
);

CREATE TABLE IF NOT EXISTS venda (
    id_venda SERIAL PRIMARY KEY,
    data_venda DATE DEFAULT CURRENT_DATE,
    id_cliente INT REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    id_produto INT REFERENCES produto(id_produto),
    preco DECIMAL(10, 2) NOT NULL,
    enviar_nota BOOLEAN DEFAULT false
);
