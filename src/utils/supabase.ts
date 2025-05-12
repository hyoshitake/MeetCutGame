import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// プロフィール情報取得関数
export const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    return null;
  }
};

// プロファイル更新関数
export const updateUserProfile = async (userId: string, username: string) => {
  try {
    // upsert処理 - レコードが存在しない場合は作成し、存在する場合は更新する
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
