-- Drop the old CHECK constraint
ALTER TABLE public.collection DROP CONSTRAINT collection_type_check;

-- Add a new CHECK constraint that includes 'meme-maker'
ALTER TABLE public.collection ADD CONSTRAINT collection_type_check CHECK (type IN ('general', 'telegram-stickers', 'discord-stickers', 'meme-maker'));
