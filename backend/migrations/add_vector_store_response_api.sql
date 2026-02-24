-- Migrazione: aggiunta vector_store_id su chatbots e last_response_id su conversations
-- Da eseguire in MySQL Workbench

ALTER TABLE chatbots
    ADD COLUMN vector_store_id VARCHAR(255) NULL AFTER assistant_id;

ALTER TABLE conversations
    ADD COLUMN last_response_id VARCHAR(255) NULL AFTER thread_id;
