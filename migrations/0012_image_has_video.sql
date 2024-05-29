ALTER TABLE public.image
ADD COLUMN has_video BOOLEAN DEFAULT false;

ALTER TABLE public.collection_image
DROP CONSTRAINT collection_image_image_type_check;

ALTER TABLE public.collection_image
ADD CONSTRAINT collection_image_image_type_check CHECK (image_type IN ('no-border', 'border', 'animation', 'video'));
