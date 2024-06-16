CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.links
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    original text COLLATE pg_catalog."default" NOT NULL,
    "createdAt" date NOT NULL DEFAULT now(),
    visits integer NOT NULL DEFAULT 0,
    CONSTRAINT links_pkey PRIMARY KEY (id)
)

ALTER TABLE IF EXISTS public.links
    OWNER to u7e79dlsbt643o;
