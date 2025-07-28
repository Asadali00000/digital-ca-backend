import { z } from 'zod';

const UserRole = z.enum(['CLIENT', 'CA']);
const InvoiceStatus = z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']);
const DocCategory = z.enum([
  'TAX_DOCUMENTS',
  'FINANCIAL_STATEMENTS',
  'COMPLIANCE_DOCS',
  'CONTRACTS',
  'OTHERS',
]);
const Priority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const AlertStatus = z.enum(['PENDING', 'COMPLETED', 'DISMISSED']);

export const clientProfileSchema = z.object({
  companyName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
});

export const caProfileSchema = z.object({
  licenseNumber: z.string(),
  firm: z.string(),
  experience: z.number(),
  specialization: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: UserRole,
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  profileData: z.any().optional(),
}).superRefine((data, ctx) => {
  if (data.role === 'CA') {
    const result = caProfileSchema.safeParse(data.profileData);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: 'custom',
          message: `CA profile: ${issue.message}`,
          path: ['profileData', ...(issue.path || [])],
        });
      }
    }
  } else if (data.role === 'CLIENT') {
    const result = clientProfileSchema.safeParse(data.profileData);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: 'custom',
          message: `Client profile: ${issue.message}`,
          path: ['profileData', ...(issue.path || [])],
        });
      }
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
  createdById: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const documentSchema = z.object({
  clientId: z.string().min(1),
  category: DocCategory.optional(),
  description: z.string().optional(),
  filename: z.string().optional(),
  originalName: z.string().optional(),
  mimetype: z.string().optional(),
  size: z.number().optional(),
  path: z.string().optional(),
  uploadedById: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1),
  issuedById: z.string().optional(),
  amount: z.number(),
  tax: z.number().optional(),
  dueDate: z.string().min(1),
  description: z.string().optional(),
  status: InvoiceStatus.optional(),
  invoiceNumber: z.string().optional(),
  totalAmount: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const alertSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().min(1),
  priority: Priority.optional(),
  clientId: z.string().min(1),
  status: AlertStatus.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
