/** Small shared UI building blocks (buttons, cards, form fields, modal, toasts, logo). */
import { useEffect, useId, useRef } from 'react'
import { useToast } from './store.jsx'

export const cx = (...c) => c.filter(Boolean).join(' ')

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none'
  const sizes = { sm: 'min-h-10 px-3 text-sm', md: 'min-h-12 px-4 text-base', lg: 'min-h-14 px-6 text-lg' }
  const variants = {
    primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm',
    secondary: 'bg-white text-brand-800 border border-silver-300 hover:bg-brand-50',
    ghost: 'text-brand-700 hover:bg-brand-50',
    danger: 'bg-white text-red-700 border border-red-200 hover:bg-red-50',
  }
  return (
    <button type="button" className={cx(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

export function Card({ className, children, as: Tag = 'section', ...props }) {
  return (
    <Tag className={cx('rounded-2xl bg-white border border-silver-200 shadow-[0_1px_2px_rgba(16,24,40,.04)]', className)} {...props}>
      {children}
    </Tag>
  )
}

export function Badge({ tone = 'neutral', children, className }) {
  const tones = {
    neutral: 'bg-silver-100 text-muted border-silver-200',
    info: 'bg-brand-50 text-brand-800 border-brand-100',
    warn: 'bg-accent-100 text-accent-600 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    demo: 'bg-violet-50 text-violet-800 border-violet-200',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

export function DemoTag({ className }) {
  return (
    <Badge tone="demo" className={className}>
      Fictional demo data
    </Badge>
  )
}

export function Field({ label, hint, error, children, id: idProp, className }) {
  const autoId = useId()
  const id = idProp || autoId
  return (
    <div className={cx('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {typeof children === 'function'
        ? children({ id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-err` : hint ? `${id}-hint` : undefined })
        : children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export const inputCls =
  'w-full min-h-12 rounded-xl border border-silver-300 bg-white px-3 text-ink placeholder:text-silver-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-red-500'

export function MoneyInput({ value, onChange, className, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">$</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        className={cx(inputCls, 'pl-7', className)}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}

export function Toggle({ checked, onChange, label, description }) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-700' : 'bg-silver-300')}
      >
        <span
          className={cx('absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform', checked && 'translate-x-6')}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </label>
    </div>
  )
}

export function ChipGroup({ options, value, onChange, label, multiple = true }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          const on = multiple ? value.includes(v) : value === v
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              onClick={() => (multiple ? onChange(on ? value.filter((x) => x !== v) : [...value, v]) : onChange(on ? '' : v))}
              className={cx(
                'min-h-11 rounded-full border px-4 text-sm font-medium transition-colors',
                on ? 'border-brand-700 bg-brand-700 text-white' : 'border-silver-300 bg-white text-ink hover:bg-brand-50'
              )}
            >
              {on && <span aria-hidden="true">✓ </span>}
              {l}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function EmptyState({ icon = '📭', title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-silver-300 bg-silver-50 px-6 py-10 text-center">
      <div className="mb-2 text-3xl" aria-hidden="true">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'info', title, children, onDismiss, className }) {
  const tones = {
    info: 'bg-brand-50 border-brand-100 text-brand-900',
    warn: 'bg-accent-100 border-amber-200 text-amber-900',
    danger: 'bg-red-50 border-red-200 text-red-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    demo: 'bg-violet-50 border-violet-200 text-violet-900',
  }
  return (
    <div
      className={cx('flex items-start gap-3 rounded-xl border p-4 text-sm', tones[tone], className)}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="-m-2 min-h-10 min-w-10 rounded-lg p-2 font-bold opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button:not([data-close])')?.focus(), 30)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div
        ref={ref}
        className={cx(
          'animate-fade-in relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        )}
      >
        <div className="flex items-center justify-between border-b border-silver-200 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            data-close
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-lg text-xl text-muted hover:bg-silver-100"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-silver-200 px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>
        )}
      </div>
    </div>
  )
}

export function Spinner({ label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-silver-300 border-t-brand-700" aria-hidden="true" />
      {label}
    </span>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useToast()
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'animate-fade-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg',
            t.tone === 'danger' ? 'bg-red-700' : 'bg-ink'
          )}
        >
          <span aria-hidden="true">{t.tone === 'danger' ? '⚠️' : '✓'}</span>
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              className="min-h-10 rounded-lg px-3 font-bold text-brand-200 underline-offset-2 hover:underline"
              onClick={() => {
                t.action.onClick()
                dismissToast(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            className="min-h-10 min-w-10 rounded-lg opacity-70 hover:opacity-100"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Logo({ className = 'h-9 w-auto' }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden="true" focusable="false">
      <path d="M3.5 34 A28.5 28.5 0 0 1 31.2 5.5 L31.2 16 A18 18 0 0 0 14 34 Z" fill="#708A81" />
      <path d="M60.5 34 A28.5 28.5 0 0 0 32.8 5.5 L32.8 16 A18 18 0 0 1 50 34 Z" fill="#DD8E58" />
      <circle cx="27.5" cy="24" r="4.6" fill="#2B2129" />
      <path d="M19.5 34 A8 8 0 0 1 35.5 34 Z" fill="#2B2129" />
      <circle cx="39.5" cy="28.5" r="3.2" fill="#C2956E" />
      <path d="M34.5 34 A5 5 0 0 1 44.5 34 Z" fill="#C2956E" />
      <rect x="1.5" y="35.5" width="61" height="3" rx="1.5" fill="#2B2129" />
    </svg>
  )
}

export function Wordmark({ className, tagline }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Logo className={tagline ? 'h-11 w-auto' : 'h-8 w-auto'} />
      <span className="flex flex-col leading-none">
        <span className={cx('font-extrabold tracking-tight', tagline ? 'text-3xl' : 'text-2xl')}>
          <span className="text-kin">Kin</span>
          <span className="text-brand-600">Bridge</span>
        </span>
        {tagline && <span className="mt-1.5 text-sm font-semibold text-muted">Care smarter, spend less.</span>}
      </span>
    </span>
  )
}
