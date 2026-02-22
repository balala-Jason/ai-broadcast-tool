import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 删除单个话术
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { error } = await client
      .from("scripts")
      .delete()
      .eq("id", parseInt(id));
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete script error:", error);
    return NextResponse.json(
      { error: "删除话术失败" },
      { status: 500 }
    );
  }
}

// 获取单个话术详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from("scripts")
      .select(`
        *,
        products (id, name, category),
        style_templates (id, name, style_type)
      `)
      .eq("id", parseInt(id))
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get script error:", error);
    return NextResponse.json(
      { error: "获取话术详情失败" },
      { status: 500 }
    );
  }
}
