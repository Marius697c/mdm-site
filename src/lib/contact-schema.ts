import { z } from "zod";

export const PROFILES = ["investor", "pharmacist", "other"] as const;

/** Les messages d'erreur sont des clés de traduction (`Contact.errors.*`). */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "nameRequired").max(120, "messageLong"),
  email: z.string().trim().email("emailInvalid").max(200, "emailInvalid"),
  profile: z.enum(PROFILES, { message: "profileRequired" }),
  organization: z.string().trim().max(160, "messageLong").optional().default(""),
  message: z.string().trim().min(10, "messageShort").max(4000, "messageLong"),
  consent: z.literal(true, { message: "consentRequired" }),
  /** Champ piège anti-spam : doit rester vide. */
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
