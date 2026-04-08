/**
 * NavigationContext — global navigation callbacks so any component can deep-link
 * to the Object, Transaction, or Package inspector without prop-drilling.
 */
import { createContext, useContext, type ReactNode } from 'react'

export interface NavigationHandlers {
  openObject: (id: string) => void
  openTransaction: (digest: string) => void
  openPackage: (id: string) => void
}

const NavigationContext = createContext<NavigationHandlers>({
  openObject: () => {},
  openTransaction: () => {},
  openPackage: () => {},
})

export function NavigationProvider({
  children,
  handlers,
}: {
  children: ReactNode
  handlers: NavigationHandlers
}) {
  return (
    <NavigationContext.Provider value={handlers}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationContext)
}
