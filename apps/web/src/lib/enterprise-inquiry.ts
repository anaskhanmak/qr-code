import { z } from "zod";

export const enterpriseInquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100, "Name must be 100 characters or fewer."),
  email: z.string().trim().email("Enter a valid work email.").max(320).transform((email) => email.toLowerCase()),
  company: z.string().trim().max(120, "Company name must be 120 characters or fewer.").optional().transform((value) => value || null),
  message: z.string().trim().min(20, "Tell us a little more about your use case.").max(5000, "Message must be 5,000 characters or fewer."),
});

export type EnterpriseInquiryInput = z.infer<typeof enterpriseInquirySchema>;
