import { NextResponse } from "next/server"
import { retainMemory, CAMPUS_BANK } from "@/lib/hindsight"
import { CAMPUS_DATA } from "@/lib/campus-data"

export async function POST() {
    try {
        // Check if already seeded
        const check = await fetch(
            `${process.env.HINDSIGHT_BASE_URL}/memories?bank_id=${CAMPUS_BANK}&limit=1`,
            { headers: { "Authorization": `Bearer ${process.env.HINDSIGHT_API_KEY}` } }
        )
        if (check.ok) {
            const data = await check.json()
            const existing = data.memories ?? data.results ?? []
            if (existing.length > 0) return NextResponse.json({ alreadySeeded: true })
        }

        // Seed all campus data
        await Promise.all(
            CAMPUS_DATA.map((item: string) => retainMemory(CAMPUS_BANK, item, "campus_seed"))
        )
        return NextResponse.json({ seeded: CAMPUS_DATA.length })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
