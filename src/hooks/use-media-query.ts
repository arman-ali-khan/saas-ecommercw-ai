'use client'

import * as React from 'react'

/**
 * A custom hook that tracks the state of a CSS media query.
 * @param query The media query string to match.
 * @returns A boolean indicating whether the media query matches.
 */
export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches)
    }

    const result = window.matchMedia(query)
    // Set initial value
    setValue(result.matches)
    
    // Add event listener
    result.addEventListener('change', onChange)

    // Clean up event listener
    return () => result.removeEventListener('change', onChange)
  }, [query])

  return value
}
