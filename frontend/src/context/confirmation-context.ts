import { createContext, useContext } from "react"

export interface ConfirmationOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export type ConfirmAction = (
  options: ConfirmationOptions,
) => Promise<boolean>

export const ConfirmationContext =
  createContext<ConfirmAction | null>(null)

export function useConfirm(): ConfirmAction {
  const confirm = useContext(ConfirmationContext)

  if (!confirm) {
    throw new Error("useConfirm must be used inside ConfirmationProvider.")
  }

  return confirm
}
