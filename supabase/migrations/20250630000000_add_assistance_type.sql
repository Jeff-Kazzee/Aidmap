-- Add assistance_type to support both monetary and service-based help
ALTER TABLE aid_requests 
ADD COLUMN assistance_type text DEFAULT 'monetary' CHECK (assistance_type IN ('monetary', 'service', 'both'));

-- Make amount_algo nullable for service-only requests
ALTER TABLE aid_requests 
ALTER COLUMN amount_algo DROP NOT NULL;

-- Add constraint to ensure monetary requests have amount
ALTER TABLE aid_requests
ADD CONSTRAINT check_monetary_has_amount 
CHECK (
  (assistance_type = 'service' AND amount_algo IS NULL) OR
  (assistance_type IN ('monetary', 'both') AND amount_algo IS NOT NULL AND amount_algo > 0)
);

-- Add service_description column for non-monetary assistance details
ALTER TABLE aid_requests
ADD COLUMN service_description text;

-- Update existing records to have assistance_type = 'monetary'
UPDATE aid_requests SET assistance_type = 'monetary' WHERE assistance_type IS NULL;

-- Add indexes for better query performance
CREATE INDEX idx_aid_requests_assistance_type ON aid_requests(assistance_type);
CREATE INDEX idx_aid_requests_status_assistance ON aid_requests(status, assistance_type);