CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.links
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    original text NOT NULL,
    submitter character varying(128) NOT NULL,
    "createdAt" date NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.links
    OWNER to u7e79dlsbt643o;
