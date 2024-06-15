CREATE TABLE public.links
(
    "createdAt" date NOT NULL,
    abbr uuid NOT NULL,
    original text NOT NULL,
    submitter character varying(128) NOT NULL,
    PRIMARY KEY (abbr)
);

ALTER TABLE IF EXISTS public.links
    OWNER to u7e79dlsbt643o;
