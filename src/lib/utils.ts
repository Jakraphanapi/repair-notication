import { type ClassValue, clsx } from "clsx";
// import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
  // return twMerge(clsx(inputs))
}

export function generateTicketNumber(): string {
  const prefix = "REP";
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp.slice(-6)}-${random}`;
}

export function formatPhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as (XXX) XXX-XXXX for Thai numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phone;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[0-9-()s]{10,15}$/;
  return phoneRegex.test(phone);
}
