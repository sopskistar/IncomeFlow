import { NextResponse } from "next/server";
import { verifyPassport } from "@/lib/passport-chain";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.startsWith("application/json"))
      return NextResponse.json({ error: "JSON required." }, { status: 415 });
    if (Number(request.headers.get("content-length") || 0) > 50000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const reader = request.body?.getReader();
    if (!reader)
      return NextResponse.json(
        { error: "JSON body required." },
        { status: 400 },
      );
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 50000) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Request too large." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return NextResponse.json(await verifyPassport(JSON.parse(raw)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message.split("\n")[0].slice(0, 250)
            : "Verification unavailable. Try again.",
      },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
}
