import { NextResponse } from "next/server"

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
        const res = await fetch(
            `${process.env.HINDSIGHT_BASE_URL}/v1/default/banks/student_${userId}/memories/list?limit=20`,
            { headers: { "Authorization": `Bearer ${process.env.HINDSIGHT_API_KEY}` } }
        )
        if (res.status === 404) return NextResponse.json({ memories: [] })
        const data = await res.json()
        const memories: MemoryUnit[] = (data.items ?? []).map((m: any) => ({
            id: m.id,
            content: m.text,
            type: m.type ?? "experience",
            created_at: m.mentioned_at ?? m.occurred_start ?? new Date().toISOString(),
            tags: m.tags ?? []
        }))
        return NextResponse.json({ memories })
    } catch (e) {
        return NextResponse.json({ memories: [] })
    }
}
