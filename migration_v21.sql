ALTER TABLE client_notes
  ADD COLUMN cpf VARCHAR(20) DEFAULT NULL,
  ADD UNIQUE KEY uniq_client_cpf (cpf);
