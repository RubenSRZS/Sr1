import * as React from "react"

import { Textarea } from "@/components/ui/textarea"

/**
 * Zone de texte qui s'agrandit quand on écrit dedans (pour voir tout le texte
 * et sélectionner / copier-coller facilement), puis redevient petite quand on
 * en sort.
 */
const AutoGrowTextarea = React.forwardRef(({ onFocus, onBlur, minExpandedHeight = 120, value, ...props }, ref) => {
  const innerRef = React.useRef(null)
  const [focused, setFocused] = React.useState(false)

  React.useImperativeHandle(ref, () => innerRef.current)

  const fit = React.useCallback(() => {
    const el = innerRef.current
    if (!el) return
    if (!focused) {
      el.style.height = ""
      return
    }
    // Garde la position de la page pour éviter les sauts pendant le calcul
    const scrollY = window.scrollY
    el.style.height = "auto"
    el.style.height = `${Math.max(el.scrollHeight + 2, minExpandedHeight)}px`
    if (window.scrollY !== scrollY) window.scrollTo(window.scrollX, scrollY)
  }, [focused, minExpandedHeight])

  React.useLayoutEffect(() => { fit() }, [fit, value])

  return (
    <Textarea
      ref={innerRef}
      value={value}
      onFocus={(e) => { setFocused(true); onFocus?.(e) }}
      onBlur={(e) => { setFocused(false); onBlur?.(e) }}
      {...props}
    />
  )
})
AutoGrowTextarea.displayName = "AutoGrowTextarea"

export { AutoGrowTextarea }
