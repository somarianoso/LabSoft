-- Correlação dos eventos com a requisição que os gerou.
-- A conexão do serviço define wellflix.correlacao com o X-Request-ID da
-- requisição HTTP (ver shared/database.py); o evento gravado pelo trigger
-- herda esse valor, que segue no Kafka como cabeçalho e aparece nos logs do
-- produtor e dos consumidores.

ALTER TABLE outbox_eventos
    ADD COLUMN correlacao TEXT DEFAULT NULLIF(current_setting('wellflix.correlacao', true), '');
