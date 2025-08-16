
import { z } from 'zod';

export const NameSchema = z.string().min(2, { message: 'Name must be at least 2 characters long.' });

export const EmailSchema = z.string().email({ message: 'Invalid email address.' });

export const PasswordSchema = z.string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
  });

export const OTPSchema = z.string().length(6, { message: 'OTP must be 6 digits.' });
