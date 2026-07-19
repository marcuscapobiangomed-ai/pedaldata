-- Pedal Data - Supabase Schema
-- Executar no SQL Editor do Supabase

-- 1. Profiles (estende auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  level TEXT CHECK (level IN ('iniciante', 'intermediario', 'avancado', 'atleta')),
  budget_min INTEGER,
  budget_max INTEGER,
  riding_style TEXT CHECK (riding_style IN ('endurance', 'race', 'gravel', 'commute')),
  favorite_brands TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Favoritos
CREATE TABLE public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- 3. Histórico de comparações
CREATE TABLE public.comparison_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_ids TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Alertas de preço
CREATE TABLE public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  target_price INTEGER,
  alert_type TEXT CHECK (alert_type IN ('below', 'drop_percent', 'in_stock')) DEFAULT 'drop_percent',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, alert_type)
);

-- 5. Newsletter subscriptions
CREATE TABLE public.newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'monthly')) DEFAULT 'weekly',
  categories TEXT[],
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_favorites_user ON public.favorites(user_id);
CREATE INDEX idx_favorites_product ON public.favorites(product_id);
CREATE INDEX idx_comparison_user ON public.comparison_history(user_id);
CREATE INDEX idx_alerts_user ON public.price_alerts(user_id);
CREATE INDEX idx_alerts_product ON public.price_alerts(product_id);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscriptions(email);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own comparisons"
  ON public.comparison_history FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own alerts"
  ON public.price_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Trigger: atualiza updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
