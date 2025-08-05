import { useCallback, useEffect, useState } from 'react'
import { fetchLocale, getLanguageCodeFromLS } from '../helpers'
import full from '../config/translations.json'
import i18n from '../i18n'

export const useLocaleBundle = () => {
  const lang = getLanguageCodeFromLS()
  const [state, setState] = useState<{
    bundle: Record<string, string>
    ver: number
    isFetching: boolean
  }>({
    bundle: full,
    ver: 0,
    isFetching: !i18n.hasResourceBundle(lang, 'translation'),
  })
  const switchBundle = useCallback(async (lang: string) => {
    if (!i18n.hasResourceBundle(lang, 'translation')) {
      setState((prev) => ({ ...prev, isFetching: true }))
      const localeData = await fetchLocale(lang)
      if (localeData) {
        i18n.addResourceBundle(lang, 'translation', localeData, true, true)
        setState((prev) => ({
          bundle: localeData,
          ver: prev.ver + 1,
          isFetching: false,
        }))
        return
      }
    }
    setState((prev) => ({
      bundle: i18n.getResourceBundle(lang, 'translation') || full,
      ver: prev.ver + 1,
      isFetching: false,
    }))
  }, [])

  useEffect(() => {
    switchBundle(lang)
  }, [lang, switchBundle])

  const { bundle, ver, isFetching } = state
  return { lang, bundle, ver, isFetching, refresh: () => setState((p) => ({ ...p, ver: p.ver + 1 })) }
}
