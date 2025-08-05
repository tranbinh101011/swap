import { I18nextProvider } from 'react-i18next'
import { createContext, useCallback, useMemo } from 'react'
import i18n from './i18n'
import { EN, languages } from './config/languages'
import { LS_KEY } from './helpers'
import { ContextApi, Language, TranslateFunction } from './types'
import { useLocaleBundle } from './hooks/useLocaleBundle'

export const LanguageContext = createContext<ContextApi | undefined>(undefined)

const cache = new Map<string, string>()

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { lang, bundle, ver, refresh, isFetching } = useLocaleBundle()

  const setLanguage = useCallback(
    async (language: Language) => {
      localStorage?.setItem(LS_KEY, language.locale)
      await i18n.changeLanguage(language.locale)
      refresh()
    },
    [refresh],
  )

  const translate: TranslateFunction = useCallback(
    (key, data) => {
      if (isFetching) {
        return ''
      }
      const cacheKey = `${lang}:${ver}:${key}-${JSON.stringify(data)}`
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey) || ''
      }
      function getTranslationValue() {
        return bundle[key] || ''
      }

      const value = getTranslationValue()

      const interpolated = value.replace(/%([a-zA-Z0-9-_]+)%/g, (match, p1) => {
        const replacement = data?.[p1] || ''
        return (replacement === undefined ? match : replacement) as string
      })
      cache.set(cacheKey, interpolated)
      return interpolated
    },
    [bundle, lang, ver, isFetching],
  )

  const providerValue = useMemo(() => {
    const currentLanguage = languages[lang] || EN
    return { currentLanguage, setLanguage, t: translate, isFetching: false }
  }, [setLanguage, translate, lang])
  if (isFetching) {
    return null
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageContext.Provider value={providerValue}>{children}</LanguageContext.Provider>
    </I18nextProvider>
  )
}
