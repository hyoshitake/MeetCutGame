import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// プロファイル更新関数
export const updateUserProfile = async (userId: string, username: string) => {
  try {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      username,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("プロファイル更新エラー:", error);
    return { success: false, error };
  }
};
