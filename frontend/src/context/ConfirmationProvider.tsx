import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  ConfirmationContext,
  type ConfirmationOptions,
} from "./confirmation-context"

interface PendingConfirmation {
  options: ConfirmationOptions
  resolve: (confirmed: boolean) => void
  previousFocus: HTMLElement | null
}

interface ConfirmationProviderProps {
  children: ReactNode
}

function ConfirmationProvider({
  children,
}: ConfirmationProviderProps) {
  const [pending, setPending] =
    useState<PendingConfirmation | null>(null)
  const pendingRef = useRef<PendingConfirmation | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null)

  const confirm = useCallback((options: ConfirmationOptions) => {
    return new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false)
      const next = {
        options,
        resolve,
        previousFocus:
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null,
      }
      pendingRef.current = next
      setPending(next)
    })
  }, [])

  const finish = useCallback((confirmed: boolean) => {
    const active = pendingRef.current
    pendingRef.current = null
    setPending(null)
    active?.resolve(confirmed)
    window.setTimeout(() => active?.previousFocus?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!pending) return

    cancelButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(false)

      if (event.key === "Tab") {
        const cancelButton = cancelButtonRef.current
        const confirmButton = confirmButtonRef.current
        const activeElement = document.activeElement

        if (!cancelButton || !confirmButton) return

        if (event.shiftKey && activeElement === cancelButton) {
          event.preventDefault()
          confirmButton.focus()
        } else if (
          !event.shiftKey &&
          (activeElement === confirmButton ||
            !dialogRef.current?.contains(activeElement))
        ) {
          event.preventDefault()
          cancelButton.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [pending, finish])

  return (
    <ConfirmationContext.Provider value={confirm}>
      {children}
      {pending && (
        <div className="confirm-overlay">
          <section
            ref={dialogRef}
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <span className="confirm-dialog-mark" aria-hidden="true">!</span>
            <h2 id="confirm-dialog-title">{pending.options.title}</h2>
            <p id="confirm-dialog-message">{pending.options.message}</p>
            <div className="confirm-dialog-actions">
              <button
                ref={cancelButtonRef}
                type="button"
                className="confirm-cancel"
                onClick={() => finish(false)}
              >
                {pending.options.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                className="confirm-accept"
                onClick={() => finish(true)}
              >
                {pending.options.confirmLabel ?? "Continue"}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmationContext.Provider>
  )
}

export default ConfirmationProvider
