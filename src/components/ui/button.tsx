import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('inline-flex min-w-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50', className)} {...props} />;
}
