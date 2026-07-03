import { NextResponse } from "next/server";

import { consentSchema } from "@/lib/forms";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = consentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid-payload" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    stored: true,
    decision: parsed.data.decision,
  });
}
