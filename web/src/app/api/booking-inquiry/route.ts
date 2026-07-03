import { NextResponse } from "next/server";

import { bookingInquirySchema } from "@/lib/forms";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  if (!checkRateLimit(`booking-inquiry:${ip}`)) {
    return NextResponse.json({ ok: false, error: "rate-limited" }, { status: 429 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bookingInquirySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid-payload" }, { status: 400 });
  }

  if (parsed.data.honey) {
    return NextResponse.json({ ok: false, error: "spam-detected" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
