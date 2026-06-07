import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('h-11 w-full rounded-xl border bg-background/60 px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring', className)} {...props} />;
}
