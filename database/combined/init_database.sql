-- Create a trigger to update 'updated_at' on every update

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Image table

CREATE TABLE public.image (
    id INTEGER PRIMARY KEY,
    title VARCHAR(256),
    artist VARCHAR(256),
    has_animation BOOLEAN DEFAULT false,
    has_border BOOLEAN DEFAULT false,
    has_no_border BOOLEAN DEFAULT false,
    slug VARCHAR(256) CHECK (slug = LOWER(slug)),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_slug_or_null ON public.image (slug) WHERE slug IS NOT NULL;

-- Assign the updated_at trigger to the Image table

CREATE TRIGGER update_image_updated_at
BEFORE UPDATE ON image
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create Tag table

CREATE TABLE public.tag (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256) UNIQUE NOT NULL CHECK (title = LOWER(title)),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assign the updated_at trigger to the Tag table

CREATE TRIGGER update_tag_updated_at
BEFORE UPDATE ON tag
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create junction table for Image to Tag many-to-many relationship

CREATE TABLE public.image_tag (
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES public.tag(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, tag_id)
);

-- Create the image_count materialized view
CREATE MATERIALIZED VIEW image_count_materialized_view AS
SELECT COUNT(*) AS image_count FROM public.image;

-- Create the tag_count materialized view
CREATE MATERIALIZED VIEW tag_count_materialized_view AS
SELECT COUNT(*) AS tag_count FROM public.tag;

ALTER TABLE public.image
DROP COLUMN artist;

-- Create Artist table

CREATE TABLE public.artist (
    id SERIAL PRIMARY KEY,
    name VARCHAR(256) COLLATE "C" UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Assign the updated_at trigger to the Artist table

CREATE TRIGGER update_artist_updated_at
BEFORE UPDATE ON artist
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create junction table for Image to Artist many-to-many relationship

CREATE TABLE public.image_artist (
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    artist_id INTEGER REFERENCES public.artist(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, artist_id)
);

-- Create the artist_count materialized view
CREATE MATERIALIZED VIEW artist_count_materialized_view AS
SELECT COUNT(*) AS artist_count FROM public.artist;

ALTER TABLE Artist
ADD COLUMN slug VARCHAR(256) CHECK (slug = LOWER(slug));

CREATE UNIQUE INDEX artist_unique_slug_or_null ON public.artist (slug) WHERE slug IS NOT NULL;

ALTER TABLE Artist
ADD COLUMN has_profile_picture BOOLEAN DEFAULT false;

ALTER TABLE Artist
ADD COLUMN twitter_username VARCHAR(15);

ALTER TABLE Artist
ADD COLUMN deca_username VARCHAR(500);

ALTER TABLE Artist
ADD COLUMN foundation_username VARCHAR(500);

ALTER TABLE Artist
ADD COLUMN instagram_username VARCHAR(30);

ALTER TABLE Artist
ADD COLUMN superrare_username VARCHAR(30);

-- Create collection table
CREATE TABLE public.collection (
    id SERIAL PRIMARY KEY,
    title VARCHAR(256),
    type VARCHAR(20) DEFAULT 'general' CHECK (type IN ('general', 'telegram-stickers', 'discord-stickers')),
    slug VARCHAR(256) CHECK (slug = LOWER(slug)),
    stickers_url VARCHAR(2083),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX collection_unique_slug_or_null ON public.collection (slug) WHERE slug IS NOT NULL;

-- Create junction table for Collection to Image many-to-many relationship
CREATE TABLE public.collection_image (
    collection_id INTEGER REFERENCES public.collection(id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES public.image(id) ON DELETE CASCADE,
    image_position INTEGER NOT NULL,
    preview_position INTEGER CHECK (preview_position >= 1 OR preview_position IS NULL),
    image_type VARCHAR(20) NOT NULL DEFAULT 'no-border' CHECK (image_type IN ('no-border', 'border', 'animation')),
    PRIMARY KEY (collection_id, image_id),
    CONSTRAINT image_position_check CHECK (image_position >= 1),
    CONSTRAINT unique_image_position_per_collection_image UNIQUE (collection_id, image_position),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add a partial unique index to enforce uniqueness of preview_position within each collection_id where preview_position is not null
CREATE UNIQUE INDEX unique_preview_position_per_collection
ON public.collection_image (collection_id, preview_position)
WHERE preview_position IS NOT NULL;

ALTER TABLE public.artist
ADD COLUMN "total_images" INTEGER DEFAULT 0 CHECK ("total_images" >= 0);
-- Add image.type column
ALTER TABLE public.image
ADD COLUMN "type" VARCHAR(17) DEFAULT 'painting' CHECK (type IN ('painting', 'meme', 'painting-and-meme'));

ALTER TABLE public.image
ADD COLUMN has_video BOOLEAN DEFAULT false;

ALTER TABLE public.collection_image
DROP CONSTRAINT collection_image_image_type_check;

ALTER TABLE public.collection_image
ADD CONSTRAINT collection_image_image_type_check CHECK (image_type IN ('no-border', 'border', 'animation', 'video'));

CREATE MATERIALIZED VIEW image_random_order_materialized_view AS
SELECT id, type, has_animation, has_border, has_no_border, has_video
FROM image
ORDER BY RANDOM();

-- Drop the old CHECK constraint
ALTER TABLE public.collection DROP CONSTRAINT collection_type_check;

-- Add a new CHECK constraint that includes 'meme-maker'
ALTER TABLE public.collection ADD CONSTRAINT collection_type_check CHECK (type IN ('general', 'telegram-stickers', 'discord-stickers', 'meme-maker'));

ALTER TABLE public.image
ADD COLUMN last_get_random_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

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

