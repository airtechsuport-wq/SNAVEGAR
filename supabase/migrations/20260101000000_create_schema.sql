-- Criar a tabela daily_records
CREATE TABLE IF NOT EXISTS public.daily_records (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    created_by_email TEXT,
    date DATE,
    team TEXT,
    van_plate TEXT,
    start_time TIME,
    km_start NUMERIC,
    km_end NUMERIC,
    km_total NUMERIC,
    articles_loaded NUMERIC,
    articles_delivered NUMERIC,
    articles_not_delivered NUMERIC,
    reason_not_delivered TEXT,
    scraps_collected NUMERIC,
    scrap_client_names TEXT,
    fueling BOOLEAN,
    fuel_amount NUMERIC,
    toll_amount NUMERIC,
    attachments JSONB,
    notes TEXT,
    status TEXT,
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para a tabela
DO $$
BEGIN
    DROP POLICY IF EXISTS "Usuários podem ver todos os registros" ON public.daily_records;
    DROP POLICY IF EXISTS "Usuários podem inserir registros" ON public.daily_records;
    DROP POLICY IF EXISTS "Usuários podem atualizar registros" ON public.daily_records;
    DROP POLICY IF EXISTS "Usuários podem deletar registros" ON public.daily_records;
EXCEPTION WHEN OTHERS THEN
END
$$;

CREATE POLICY "Usuários podem ver todos os registros" 
ON public.daily_records FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem inserir registros" 
ON public.daily_records FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar registros" 
ON public.daily_records FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Usuários podem deletar registros" 
ON public.daily_records FOR DELETE 
TO authenticated 
USING (true);

-- Criar o bucket de imagens (precisa usar API do storage se o SQL não funcionar direto no schema antigo, mas funciona nas versões novas)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('app-images', 'app-images', true) 
ON CONFLICT (id) DO NOTHING;

-- Configurar regras do bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
    DROP POLICY IF EXISTS "Upload de imagens" ON storage.objects;
    DROP POLICY IF EXISTS "Atualizar imagens" ON storage.objects;
    DROP POLICY IF EXISTS "Deletar imagens" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
END
$$;

CREATE POLICY "Imagens públicas" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'app-images');

CREATE POLICY "Upload de imagens" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'app-images');

CREATE POLICY "Atualizar imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'app-images');

CREATE POLICY "Deletar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'app-images');
