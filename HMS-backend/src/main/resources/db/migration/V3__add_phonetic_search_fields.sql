-- Add phonetic search fields to patients table
ALTER TABLE patients
ADD COLUMN first_name_phonetic VARCHAR(10),
ADD COLUMN last_name_phonetic VARCHAR(10),
ADD COLUMN full_name_phonetic VARCHAR(20);

-- Create indexes for phonetic search performance
CREATE INDEX idx_patients_first_name_phonetic ON patients(first_name_phonetic);
CREATE INDEX idx_patients_last_name_phonetic ON patients(last_name_phonetic);
CREATE INDEX idx_patients_full_name_phonetic ON patients(full_name_phonetic);

-- Add phonetic search field to users table for future extensibility
ALTER TABLE users
ADD COLUMN username_phonetic VARCHAR(10);

CREATE INDEX idx_users_username_phonetic ON users(username_phonetic);
