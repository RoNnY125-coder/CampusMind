import { NextResponse } from "next/server"
import { retainMemory } from "@/lib/hindsight"

export async function POST(request: Request) {
    try {
        const { name, year, branch, interests, clubs, userId } = await request.json()

        await Promise.all([
            retainMemory("student_" + userId, `Student's name is ${name}`, "onboarding"),
            retainMemory("student_" + userId, `${name} is in ${year} studying ${branch}`, "onboarding"),
            retainMemory("student_" + userId, `${name} is interested in: ${interests.join(", ")}`, "onboarding"),
            retainMemory("student_" + userId, `${name} has joined: ${clubs.join(", ")}`, "onboarding"),
            retainMemory("student_" + userId, `Onboarded on ${new Date().toLocaleDateString("en-IN")}`, "onboarding"),
        ])

        return NextResponse.json({ ok: true, userId })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
