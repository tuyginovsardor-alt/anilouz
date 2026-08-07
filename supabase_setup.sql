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
