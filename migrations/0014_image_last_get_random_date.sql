ALTER TABLE public.image
ADD COLUMN last_get_random_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
