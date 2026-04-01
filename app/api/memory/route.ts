import { NextResponse } from "next/server"
import { HINDSIGHT_API_KEY, HINDSIGHT_BASE_URL } from "@/lib/env";

export const dynamic = "force-dynamic"

interface MemoryUnit {
  id: string
  content: string
  type: "world" | "experience" | "observation"
  created_at: string
  tags?: string[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const url = `${HINDSIGHT_BASE_URL()}/v1/default/banks/student_${userId}/memories/list?limit=20`
    console.log("[memory] fetching:", url)
    
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${HINDSIGHT_API_KEY()}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    })

    console.log("[memory] status:", res.status)
    const rawText = await res.text()
    console.log("[memory] raw response:", rawText)

    if (res.status === 404) return NextResponse.json({ memories: [] })

    let data
    try {
      data = JSON.parse(rawText)
    } catch(e) {
      console.error("[memory] parse error:", e)
      return NextResponse.json({ memories: [] })
    }

    const raw = data.items ?? []
    console.log("[memory] raw items count:", raw.length)

    const memories: MemoryUnit[] = raw.map((m: any) => ({
      id: m.id ?? Math.random().toString(),
      content: m.text ?? "",
      type: m.fact_type ?? "experience",
      created_at: m.mentioned_at ?? m.date ?? new Date().toISOString(),
      tags: m.tags ?? []
    }))

    console.log("[memory] mapped memories count:", memories.length)
    return NextResponse.json({ memories })

  } catch (e: any) {
    console.error("[memory] error:", e)
    return NextResponse.json({ memories: [] })
  }
}
