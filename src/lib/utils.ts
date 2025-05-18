import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: (string | undefined | null | false | ClassValue)[]) {
  return twMerge(clsx(inputs))
}
