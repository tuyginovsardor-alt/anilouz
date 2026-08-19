/*
  Supabase SQL Editor Commands
  Run these commands to set up the Reels and Private Messages tables.
*/

-- 1. REELS TABLE
CREATE TABLE IF NOT EXISTS reels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  video_url TEXT NOT NULL,
  description TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_verified BOOLEAN DEFAULT false
);

-- RLS for Reels
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view approved reels" ON reels
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can insert their own reels" ON reels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own reels" ON reels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reels" ON reels
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
    )
  );

-- 2. PRIVATE MESSAGES TABLE
CREATE TABLE IF NOT EXISTS private_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Private Messages
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own private messages" ON private_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send private messages" ON private_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 3. REEL LIKES (Optional but recommended)
CREATE TABLE IF NOT EXISTS reel_likes (
  reel_id UUID REFERENCES reels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (reel_id, user_id)
);

ALTER TABLE reel_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view likes" ON reel_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike" ON reel_likes FOR ALL USING (auth.uid() = user_id);

-- 4. PROFILES ROLE COLUMN UPDATE
-- Add role column to profiles if missing ('user', 'fandub', 'admin', 'owner')
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
      ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
  END IF;
END $$;

-- 5. FANDUB STUDIOS PROFILE TABLE
CREATE TABLE IF NOT EXISTS fandub_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  studio_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL, -- e.g. @AniloDubbing, @MeduzaDub
  logo_url TEXT,
  bio TEXT,
  card_number TEXT,
  balance NUMERIC(12, 2) DEFAULT 0.00,
  total_earned NUMERIC(12, 2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT false,
  commission_agreed BOOLEAN DEFAULT false, -- Shartnomaga (8% komissiya) rozilik
  subscribers_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE fandub_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view fandub profiles" ON fandub_profiles
  FOR SELECT USING (true);

CREATE POLICY "Fandub owners can update their own profile" ON fandub_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Fandub owners can insert profile" ON fandub_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all fandub profiles" ON fandub_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
    )
  );

-- 6. FANDUB PAYOUT REQUESTS & BALANCE SYSTEM
CREATE TABLE IF NOT EXISTS fandub_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fandub_id UUID REFERENCES fandub_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- Yalpi so'ralgan summa
  net_amount NUMERIC(12, 2) NOT NULL, -- 92% fandub qo'liga tegadigan summa
  platform_fee NUMERIC(12, 2) NOT NULL, -- 5% platforma ulushi
  auto_pay_fee NUMERIC(12, 2) NOT NULL, -- 3% avtoto'lov komissiyasi
  card_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, completed, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE fandub_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fandub owners can view their payouts" ON fandub_payouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fandub_profiles 
      WHERE id = fandub_payouts.fandub_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Fandub owners can request payouts" ON fandub_payouts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM fandub_profiles 
      WHERE id = fandub_payouts.fandub_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts" ON fandub_payouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
    )
  );

-- 7. FANDUB ANIMES LINKING TABLE
CREATE TABLE IF NOT EXISTS fandub_animes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fandub_id UUID REFERENCES fandub_profiles(id) ON DELETE CASCADE,
  anime_id TEXT NOT NULL,
  anime_title TEXT NOT NULL,
  episodes_count INTEGER DEFAULT 1,
  is_premium_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE fandub_animes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view fandub animes" ON fandub_animes FOR SELECT USING (true);
CREATE POLICY "Fandubs can manage their anime content" ON fandub_animes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM fandub_profiles 
      WHERE id = fandub_animes.fandub_id AND user_id = auth.uid()
    )
  );

