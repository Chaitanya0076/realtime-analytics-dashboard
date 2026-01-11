import { z } from "zod";

// Signup validation schema
export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  name: z
    .string()
    .max(50, "Name must be less than 50 characters")
    .optional()
    .transform((val) => val || undefined),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be less than 128 characters"),
});

// Helper function to normalize domain (same as in route handler)
function normalizeDomainForValidation(domain: string): string {
  const trimmedDomain = domain.trim().toLowerCase();
  // Remove protocol (http://, https://)
  let normalized = trimmedDomain.replace(/^https?:\/\//, "");
  // Remove www. prefix
  normalized = normalized.replace(/^www\./, "");
  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, "");
  // Remove any path after domain
  normalized = normalized.split('/')[0];
  // Remove port numbers
  normalized = normalized.split(':')[0];
  // Final trim to ensure no leading/trailing spaces
  return normalized.trim();
}

// Domain validation schema
export const domainSchema = z.object({
  name: z
    .string()
    .min(1, "Domain name is required")
    .max(255, "Domain name must be less than 255 characters")
    .refine(
      (val) => {
        // Normalize the domain first (handle URLs, www, trailing slashes, etc.)
        const normalized = normalizeDomainForValidation(val);
        
        if (normalized.length === 0) {
          return false;
        }
        
        // Allow localhost for development
        if (normalized === "localhost" || normalized.startsWith("localhost:")) {
          return true;
        }
        
        // Standard domain validation - accepts all TLDs including .in, .app, .dev, .net, etc.
        // Pattern: domain name with at least one dot and TLD of 2+ characters
        // Examples: example.com, subdomain.example.in, my-site.app, test.dev, domain.net
        const domainRegex = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(\.[a-z]{2,})+$/;
        return domainRegex.test(normalized);
      },
      {
        message: "Invalid domain name format. Please enter a valid domain (e.g., example.com, mysite.app, domain.in)",
      }
    ),
});

// Event payload validation schema
export const eventPayloadSchema = z.object({
  domain: z
    .string()
    .min(1, "Domain is required")
    .max(255, "Domain must be less than 255 characters"),
  path: z
    .string()
    .min(1, "Path is required")
    .max(2048, "Path must be less than 2048 characters"),
  url: z
    .string()
    .min(1, "URL is required")
    .max(2048, "URL must be less than 2048 characters")
    .refine(
      (val) => {
        try {
          const u = new URL(val);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      {
        message: "Invalid URL format",
      }
    ),
  referrer: z
    .string()
    .max(2048, "Referrer must be less than 2048 characters")
    .optional(),
  title: z
    .string()
    .max(512, "Title must be less than 512 characters")
    .optional(),
  sessionId: z
    .string()
    .max(255, "Session ID must be less than 255 characters")
    .optional(),
  userId: z
    .string()
    .max(255, "User ID must be less than 255 characters")
    .optional(),
  viewportWidth: z.number().int().min(0).max(100000).optional(),
  viewportHeight: z.number().int().min(0).max(100000).optional(),
});

// Domain ID validation (for route parameters)
export const domainIdSchema = z.string().min(1, "Domain ID is required").max(255);

// Type exports for use in routes
export type SignupInput = z.infer<typeof signupSchema>;
export type DomainInput = z.infer<typeof domainSchema>;
export type EventPayloadInput = z.infer<typeof eventPayloadSchema>;

