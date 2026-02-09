-- Backfill client_notes.cpf from leads (latest appointment) when missing
UPDATE client_notes cn
JOIN (
  SELECT l.name, l.contact, l.cpf
  FROM leads l
  JOIN (
    SELECT name, contact, MAX(appointment_date) AS last_date
    FROM leads
    WHERE cpf IS NOT NULL AND cpf != ''
    GROUP BY name, contact
  ) t
    ON t.name = l.name AND t.contact = l.contact AND t.last_date = l.appointment_date
  WHERE l.cpf IS NOT NULL AND l.cpf != ''
) src
  ON cn.name = src.name AND cn.contact = src.contact
SET cn.cpf = src.cpf
WHERE (cn.cpf IS NULL OR cn.cpf = '');
