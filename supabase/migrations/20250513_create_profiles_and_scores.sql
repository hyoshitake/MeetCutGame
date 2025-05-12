-- Profilesテーブルの作成
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS（Row Level Security）の設定
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーがプロフィールを読み取れるようにするポリシー
CREATE POLICY "プロフィールは誰でも閲覧可能"
  ON public.profiles
  FOR SELECT
  USING (true);

-- ユーザーが自分のプロフィールのみ更新できるようにするポリシー
CREATE POLICY "ユーザーは自分のプロフィールを更新可能"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ユーザーが自分のプロフィールのみを作成できるようにするポリシー
CREATE POLICY "ユーザーは自分のプロフィールを作成可能"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Scoresテーブルの作成
CREATE TABLE public.scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  score FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS（Row Level Security）の設定
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーがスコアを読み取れるようにするポリシー
CREATE POLICY "スコアは誰でも閲覧可能"
  ON public.scores
  FOR SELECT
  USING (true);

-- ユーザーが自分のスコアのみを作成できるようにするポリシー
CREATE POLICY "ユーザーは自分のスコアを作成可能"
  ON public.scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
