-- Create telegram_video_file table

CREATE TABLE public.telegram_video_file (
    id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL UNIQUE,
    telegram_bot_user_name VARCHAR(2083) NOT NULL,
    telegram_cached_file_id VARCHAR(2083) NOT NULL,
    CONSTRAINT fk_image
        FOREIGN KEY(image_id) 
        REFERENCES public.image(id),
    CONSTRAINT unique_bot_user_name_cached_file_id
        UNIQUE (telegram_bot_user_name, telegram_cached_file_id)
);

-- Rename telegram_bot_user_name column to telegram_chat_id

ALTER TABLE public.telegram_video_file
    RENAME COLUMN telegram_bot_user_name TO telegram_chat_id;

-- Remove the unique constraint
ALTER TABLE public.telegram_video_file
DROP CONSTRAINT telegram_video_file_image_id_key;

-- Drop the existing foreign key constraint
ALTER TABLE public.telegram_video_file
DROP CONSTRAINT fk_image;

-- Add a new foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.telegram_video_file
ADD CONSTRAINT fk_image
FOREIGN KEY (image_id)
REFERENCES public.image (id)
ON DELETE CASCADE;
