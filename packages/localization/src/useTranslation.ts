import { useContext } from 'react'
import { useTranslation as useI18nTranslation } from 'react-i18next'
import { LanguageContext } from './Provider'
import { TranslateFunction } from './types'

const useTranslation = () => {
  const languageContext = useContext(LanguageContext)
  const { t } = useI18nTranslation()

  if (languageContext === undefined) {
    throw new Error('Language context is undefined')
  }

  return { ...languageContext, t: t as TranslateFunction }
}

export default useTranslation
