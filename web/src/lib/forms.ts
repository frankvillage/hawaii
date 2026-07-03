import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  topic: z.string().min(2),
  message: z.string().min(10),
  honey: z.string().optional().default(""),
});

export const bookingInquirySchema = z.object({
  requestType: z.string().min(2),
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional().default(""),
  preferredDate: z.string().optional().default(""),
  guestCount: z.coerce.number().int().positive().max(1000).optional(),
  message: z.string().min(10),
  honey: z.string().optional().default(""),
});

export const privateEventSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(6),
  eventType: z.string().min(2),
  guestCount: z.coerce.number().int().positive().max(1000),
  message: z.string().min(10),
  honey: z.string().optional().default(""),
});

export const consentSchema = z.object({
  decision: z.enum(["accept", "reject"]),
  source: z.string().default("cookie-banner"),
});
