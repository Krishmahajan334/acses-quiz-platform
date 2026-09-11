import { z } from 'zod';

// PRN Regex: 2 digits (year) + 3 or 4 letters + 3 digits
// Example: 24UCS056
const prnRegex = /^\d{2}[A-Za-z]{3,4}\d{3}$/;

// Mobile Regex: Exactly 10 digits starting with 6, 7, 8, or 9 (Indian numbers)
const mobileRegex = /^[6-9]\d{9}$/;

export const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long").trim(),
  email: z.string().email("Invalid email address. Please provide a valid email like @gmail.com").toLowerCase().trim(),
  mobile: z.string().regex(mobileRegex, "Please enter a valid 10-digit Indian mobile number").trim(),
  year: z.enum(["FY", "SY", "TY", "Final Year"], {
    message: "Please select a valid academic year"
  }),
  prn: z.string().trim().toUpperCase().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and privacy policy",
  }),
}).superRefine((data, ctx) => {
  if (data.year !== "FY") {
    // Check if PRN is provided
    if (!data.prn || data.prn.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PRN is required for SY, TY, and Final Year students",
        path: ["prn"],
      });
      return;
    }
    
    // Check if PRN matches the strict format
    if (!prnRegex.test(data.prn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid PRN format. Example: 24UCS056 (2 digits year + 3/4 letters + 3 digits)",
        path: ["prn"],
      });
    }
  } else if (data.prn && data.prn.trim() !== "") {
    // If FY provides PRN optionally, validate it
    if (!prnRegex.test(data.prn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid PRN format. Example: 24UCS056",
        path: ["prn"],
      });
    }
  }
});

export type RegistrationFormValues = z.infer<typeof registrationSchema>;
