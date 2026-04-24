export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getOrCreateSession, getSessionMessages, saveMessage, updateSessionTitle } from "@/lib/chat-db";
import { getStudentProfile } from "@/lib/student-profile";
import type { ChatRequest } from "@/lib/types";

function buildSystemPrompt(profile: {
  name: string;
  year: string;
  branch: string;
  interests: string[];
  clubs: string[];
} | null): string {
  const base = `You are CampusMind, an intelligent campus assistant for VIT Bhopal University. Your job is to help students discover the best clubs, chapters, and communities based on their personal interests, hobbies, skills, and goals.

You have complete knowledge of all VIT Bhopal clubs stored in your knowledge base. 

CLUB DATABASE:
${JSON.stringify([{"name":"AIEM Club","cat":"Technical","desc":"Advanced Intelligence in Electronics & Mechanics — interdisciplinary engineering blending electronics, mechanics, and AI."},{"name":"AI Club","cat":"Technical","desc":"Artificial Intelligence in healthcare, finance, automation, and robotics — workshops, industry collabs, AI projects."},{"name":"Android Club","cat":"Technical","desc":"Android app development and mobile technology — coding challenges, workshops, and real-world projects."},{"name":"Anime Club","cat":"Technical","desc":"Japanese animation, manga culture, and storytelling — screenings, discussions, and anime events."},{"name":"ANTERIX Club","cat":"Technical","desc":"Astronomy and space — stargazing sessions, workshops, and guest lectures by astronomers."},{"name":"AWS Club","cat":"Technical","desc":"Cloud computing with AWS — workshops, hackathons, and certification guidance for cloud careers."},{"name":"Antique Arcade Club","cat":"Technical","desc":"Historical architecture, heritage buildings, and antique structures — architectural tours and heritage workshops."},{"name":"Bio-Engineering Club","cat":"Technical","desc":"Intersection of engineering and life sciences — innovation at the bio-engineering frontier."},{"name":"Blockchain Club","cat":"Technical","desc":"Blockchain technology and decentralized apps — talks, workshops, and hackathons on Web3."},{"name":"BashCraft Club","cat":"Technical","desc":"Real-world CS and engineering — webinars with tech founders (Zerodha, Arpit Bhayani), 300+ participant events."},{"name":"Cloud Zone","cat":"Technical","desc":"Cloud platforms, deployment, and data management — hands-on workshops and cloud computing projects."},{"name":"Coding Blocks (Bit By Bit)","cat":"Technical","desc":"Competitive coding, web dev, and app creation — hackathons, workshops, and idea sharing."},{"name":"D2C Igniters Club","cat":"Technical","desc":"Competitions, hackathons, and quizzes — competitive events, mentorship, and domain workshops."},{"name":"Data Science Club","cat":"Technical","desc":"Big data, machine learning, and analytics — workshops, hands-on projects, and guest lectures."},{"name":"E-Cell","cat":"Technical","desc":"Entrepreneurship and startups — workshops, mentorship, startup pitches, and networking events."},{"name":"Edu4U","cat":"Technical","desc":"EdTech and ICT integration — discussions, workshops, and educational tool development."},{"name":"E-Green Club","cat":"Technical","desc":"Sustainable development and green technology — workshops, hackathons, and innovation challenges."},{"name":"E-Commerce Club","cat":"Technical","desc":"Online retail, digital marketing, and e-commerce entrepreneurship — workshops and industry insights."},{"name":"Electric Vehicle Club","cat":"Technical","desc":"Electric vehicles and clean energy — hands-on EV projects, workshops, and expert talks."},{"name":"Eureka Club","cat":"Technical","desc":"Research and academic papers — mentorship, paper writing, and publishing support with professors."},{"name":"Feedbox College Club","cat":"Technical","desc":"Skilled learning and connecting students to real-world challenges."},{"name":"FYI Club","cat":"Technical","desc":"Innovation, design thinking, and prototyping — ideation sessions and design workshops."},{"name":"Freelancing Club","cat":"Technical","desc":"Graphic design, content creation, web dev, and digital marketing — portfolio building and real projects."},{"name":"GDG on Campus","cat":"Technical","desc":"Google technologies — Flutter, TensorFlow, Firebase — workshops, hackathons, and expert talks."},{"name":"Google Innovators Club","cat":"Technical","desc":"Google Summer of Code prep, open-source development, and competitive coding on Codeforces."},{"name":"Health Informatics Club","cat":"Technical","desc":"Healthcare + IT — EHR, telemedicine, and healthcare analytics workshops."},{"name":"iCreate Club","cat":"Technical","desc":"Electronics, IoT projects, and hands-on making — build IoT solutions in the electronics workspace."},{"name":"IoT Club","cat":"Technical","desc":"Internet of Things, connected devices, and smart systems — hands-on projects and mentorship."},{"name":"iOS Club","cat":"Technical","desc":"iOS app development and the Apple ecosystem — workshops, coding challenges, and development."},{"name":"LINPACK Club","cat":"Technical","desc":"MATLAB programming and LaTeX document preparation — training for engineering and research workflows."},{"name":"Linux Club","cat":"Technical","desc":"Linux OS, open-source computing, shell scripting, and system administration."},{"name":"Matrix – Multimedia Club","cat":"Technical","desc":"Technocracy, innovation, and case studies — tech events and creative tech leadership."},{"name":"MERN Stack Club","cat":"Technical","desc":"Full-stack web development using MongoDB, Express, React, Node.js — live projects and hackathons."},{"name":"Metaversity","cat":"Technical","desc":"Metaverse, virtual worlds, and immersive technologies — exploring the next frontier of digital interaction."},{"name":"Microsoft Technical Club","cat":"Technical","desc":"Microsoft technologies — Azure, AI, enterprise tools — workshops, coding competitions, and Azure certifications."},{"name":"Open-Source Club","cat":"Technical","desc":"Open-source software development and contributions — collaborative community for OSS enthusiasts."},{"name":"OWASP Club","cat":"Technical","desc":"Web application security, cybersecurity, and ethical hacking — hands-on security projects."},{"name":"PSI Society","cat":"Technical","desc":"Scientific knowledge and science communication — seminars, outreach, and experiments."},{"name":"Ramanuja Mathematica Club","cat":"Technical","desc":"Mathematics, puzzles, theorems, and math competitions — problem-solving and number theory."},{"name":"Robotics Club","cat":"Technical","desc":"Robotics combining mechanical, electronics, and programming — hands-on robot building and competitions."},{"name":"SAE India Collegiate Club","cat":"Technical","desc":"Automotive and mobility engineering — vehicle design, fabrication, and SAE competitions."},{"name":"Software Development Club","cat":"Technical","desc":"Broad software engineering — web, mobile, various frameworks — coding challenges and hackathons."},{"name":"Stats-O-Locked Club","cat":"Technical","desc":"Statistics and data analysis — exploring the power of data through statistical methods."},{"name":"Startup Club","cat":"Technical","desc":"Startup ecosystem and entrepreneurship — mentorship, networking, and idea incubation."},{"name":"TechnoMech Club","cat":"Technical","desc":"Mechanical engineering co-curricular — MechaThon, Design Challenge, Tech Hackathon, and Plenary Talks."},{"name":"The Finance Club","cat":"Technical","desc":"Finance, stocks, crypto, and financial tools — stock market simulations and financial literacy events."},{"name":"UX Club","cat":"Technical","desc":"User Experience Design — crafting intuitive and meaningful digital experiences."},{"name":"Virtual Reality & Gaming Club","cat":"Technical","desc":"VR technology, game development, and gaming tournaments — VR workshops and game design sessions."},{"name":"VITronix Club","cat":"Technical","desc":"Electronics, robotics, and automation for social good — social-impact tech projects and outreach."},{"name":"VIT Bhopal Cyber Warriors","cat":"Technical","desc":"Cybersecurity, penetration testing, and digital security — CTF challenges and skill building."},{"name":"Biz Whiz Club","cat":"Non-Technical","desc":"Business, entrepreneurship, marketing, finance, and strategy — workshops, guest lectures, and case studies."},{"name":"Cognitive Fitness Club","cat":"Non-Technical","desc":"Brain health, mindfulness, mental well-being, and stress management — brain teasers and mindfulness sessions."},{"name":"Cooking & Feasting Club","cat":"Non-Technical","desc":"Culinary arts, diverse cuisines, and cooking techniques — workshops, food tasting, and recipe exchanges."},{"name":"Dance Club","cat":"Non-Technical","desc":"Contemporary, hip-hop, traditional, and cultural dance — workshops, performances, and dance-offs."},{"name":"Defence Warriors Club","cat":"Non-Technical","desc":"Defence exam prep (CDS, AFCAT, INET, CAPF), SSB interviews, leadership, and self-defense training."},{"name":"Ekfraseis Dramatics Society","cat":"Non-Technical","desc":"Theater, acting, and storytelling — workshops, rehearsals, and stage performances."},{"name":"English Literary Club (ELA)","cat":"Non-Technical","desc":"English language, literature, fluency, and content creation — debates and social outreach events."},{"name":"Fine Arts Club (Meraki)","cat":"Non-Technical","desc":"Visual arts, painting, crafts, and art exhibitions — workshops, competitions, and Diwali art events."},{"name":"Fusion Club","cat":"Non-Technical","desc":"Event management — cultural festivals, sports, and entertainment on campus."},{"name":"Insights Club","cat":"Non-Technical","desc":"Journalism, newsletters, and magazines — monthly newsletters, annual magazine, and media events."},{"name":"MUN Club","cat":"Non-Technical","desc":"Model United Nations, global affairs, diplomacy, and debate — MUN simulations and policy discussions."},{"name":"Music & Band Club","cat":"Non-Technical","desc":"Vocal and instrumental music — guitar, keyboard, bass, drums — performances and music showcases."},{"name":"Nature & Trekking Club","cat":"Non-Technical","desc":"Outdoor adventures, trekking, and environmental conservation — treks, tree planting, and nature outings."},{"name":"Photography & Movie Making Club","cat":"Non-Technical","desc":"Photography, filmmaking, and visual storytelling — film screenings, photo walks, and filmmaking workshops."},{"name":"VIT Vista Voices","cat":"Non-Technical","desc":"Creativity, culture, and innovation — performances, competitions, and inter-college collaborations."},{"name":"VITERA","cat":"Non-Technical","desc":"Literary and cultural club — celebrating language, literature, and creative expression."},{"name":"VITKULT","cat":"Non-Technical","desc":"Art + Culture + Tech — dance, music, drama, hackathons, AI projects, and digital experiences blended together."},{"name":"Andy Haryana Club","cat":"Regional","desc":"Haryanvi culture, folk performances, and traditions — celebrating the heritage of Haryana."},{"name":"Bengali Club","cat":"Regional","desc":"Bengali culture, language, music, and festivals — for students from West Bengal."},{"name":"Central India Club","cat":"Regional","desc":"Madhya Pradesh culture, performing arts, crafts, and traditional cuisine."},{"name":"Ganga Bhumi Club","cat":"Regional","desc":"Heritage of UP, Bihar, and Jharkhand — folk arts, storytelling, and traditions."},{"name":"Gujarati Club","cat":"Regional","desc":"Gujarati culture, traditions, art, music, dance, and community service."},{"name":"Hindi Club","cat":"Regional","desc":"Hindi language, literature, poetry, debates, and cultural events."},{"name":"Malayalam Club","cat":"Regional","desc":"Kerala culture, Malayalam language, film, and music."},{"name":"Maharo Rajasthan Club","cat":"Regional","desc":"Rajasthani culture — Ghoomar, Rajasthan Day, literature, and sports."},{"name":"Marathi Club","cat":"Regional","desc":"Maharashtra culture, Marathi language, and traditions."},{"name":"North East Club","cat":"Regional","desc":"Culture of all 8 North Eastern states — language, art, music, and traditions."},{"name":"Odia Club","cat":"Regional","desc":"Odisha culture, festivals, dance, and traditions."},{"name":"Punjabi Club","cat":"Regional","desc":"Punjab culture, music nights, dance, and traditional celebrations."},{"name":"Seedhe Pahad Se (Pahadi Club)","cat":"Regional","desc":"Culture of Uttarakhand, Himachal Pradesh, and J&K — Himalayan heritage."},{"name":"Tamil Club","cat":"Regional","desc":"Tamil Nadu culture, Tamil language, literature, and poetry."},{"name":"Telugu Club","cat":"Regional","desc":"Telugu culture, language, cinema, and music."},{"name":"VIT Bhopal ACM Chapter","cat":"Chapter","desc":"Computing research, coding, and technology — workshops, seminars, hackathons affiliated with ACM."},{"name":"CSI Chapter","cat":"Chapter","desc":"Bridging academia and industry in CS — seminars, workshops, conferences, and project competitions."},{"name":"GeeksForGeeks VITB Chapter","cat":"Chapter","desc":"Programming, CS learning, and peer collaboration — coding discussions and workshops."},{"name":"IEEE Student Chapter","cat":"Chapter","desc":"Engineering and technology — collaboration, skill building, and leadership affiliated with IEEE."},{"name":"Null Student Chapter","cat":"Chapter","desc":"Information security awareness and cybersecurity community affiliated with Null."},{"name":"Omdena VIT Bhopal Chapter","cat":"Chapter","desc":"Real-world AI via open-source projects and AI education for local businesses."},{"name":"SEDS Nebula","cat":"Chapter","desc":"Space exploration and development — interdisciplinary space projects and STEM outreach."},{"name":"SIAM Student Chapter","cat":"Chapter","desc":"Applied mathematics — cryptography, CS, and forensics affiliated with SIAM."},{"name":"TEDx VIT Bhopal","cat":"Chapter","desc":"Ideas worth sharing — speakers from diverse backgrounds and inspiring interdisciplinary talks."},{"name":"Toastmasters International","cat":"Chapter","desc":"Public speaking, communication, and leadership — structured sessions, mentorship, and constructive feedback."},{"name":"Material Advantage Chapter","cat":"Chapter","desc":"Materials science for Mechanical, Robotics, and Aerospace — affiliated with ASM, AIST, ACerS, TMS."},{"name":"WiCyS","cat":"Chapter","desc":"Women in Cybersecurity — networking, knowledge sharing, and mentoring affiliated with WiCyS."},{"name":"Google Developer Student Club (GDSC)","cat":"Community","desc":"Google technologies and developer ecosystem — workshops, hackathons, certifications, and networking."},{"name":"Mozilla Firefox Club","cat":"Community","desc":"Open-source software, internet freedom, and Firefox advocacy — webinars and Mozilla project sessions."},{"name":"Cisco Community","cat":"Community","desc":"Networking, technical and professional skills via Cisco partnership."}])}

## YOUR BEHAVIOR RULES:
1. Always start by asking the student about their interests if they haven't mentioned any. Ask naturally, like a helpful friend.
2. Match clubs to interests precisely using the provided database.
3. Recommend max 5 clubs unless the user asks to list all.
4. If the user asks to list all clubs, put the full categorized list as plain text.
5. If the user hasn't shared interests yet, ask them naturally.
6. Support multi-interest students — recommend clubs from multiple domains.
7. Handle vague interests: "make friends" → cultural/regional clubs, "career" → technical clubs, "creative" → arts clubs.
8. Be friendly, encouraging, and conversational — not robotic.
9. Format your club recommendations nicely in Markdown, using bold for club names and bullet points. Include the category in parentheses, e.g., **AIEM Club** (Technical). Add a small explanation of why it matches their interest.`;

  if (!profile) return base;

  const interestsList = profile.interests.length > 0 ? profile.interests.join(", ") : "not specified";
  const clubsList = profile.clubs.length > 0 ? profile.clubs.join(", ") : "none mentioned";

  const profileSection = `

STUDENT PROFILE:
- Name: ${profile.name}
- Year: ${profile.year}
- Branch: ${profile.branch}
- Interests: ${interestsList}
- Clubs: ${clubsList}

Address the student by their first name occasionally. Tailor your advice to their branch and interests.`;

  return base + profileSection;
}

export async function POST(request: Request) {
  try {
    const { message, userId, history = [], sessionId } = (await request.json()) as ChatRequest;

    if (!message || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Fetch student profile to personalize the system prompt
    const profile = await getStudentProfile(userId);

    const session = await getOrCreateSession(userId, sessionId);

    if (!sessionId) {
      const title = message.length > 50 ? `${message.slice(0, 50)}...` : message;
      await updateSessionTitle(session.id, title);
    }

    await saveMessage(session.id, userId, "user", message);

    const dbHistory = await getSessionMessages(session.id, 40);
    const promptHistory =
      dbHistory.length > 0
        ? dbHistory.map((msg) => ({ role: msg.role, content: msg.content }))
        : history.map((msg) => ({ role: msg.role, content: msg.content }));

    const systemPrompt = buildSystemPrompt(profile);

    console.log("[chat] request start", { userId, sessionId: session.id, history: promptHistory.length, profileLoaded: !!profile });

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...promptHistory,
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatCompletion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (!text) continue;
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (error) {
          console.error("[chat] stream error:", error);
        } finally {
          controller.close();
          if (fullResponse.trim()) {
            await saveMessage(session.id, userId, "assistant", fullResponse);
          }
          console.log("[chat] request complete", { userId, sessionId: session.id });
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Session-Id": session.id,
      },
    });
  } catch (error) {
    console.error("[chat] route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
