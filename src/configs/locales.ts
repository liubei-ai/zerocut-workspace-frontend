import enMessages from '@/locales/en';
import jaMessages from '@/locales/ja';
import zhHansMessages from '@/locales/zhHans';

const supported = ['en', 'zhHans', 'ja'];
let locale = 'zhHans';

try {
  const { 0: browserLang } = navigator.language.split('-');
  if (supported.includes(browserLang)) locale = browserLang;
} catch (e) {
  console.log(e);
}

export default {
  // current locale
  locale,

  // when translation is not available fallback to that locale
  fallbackLocale: 'zhHans',

  // availabled locales for user selection
  availableLocales: [
    {
      code: 'zhHans',
      flag: 'cn',
      name: 'china',
      label: '中文',
      messages: zhHansMessages,
    },
    {
      code: 'en',
      flag: 'us',
      name: 'united-states',
      label: 'English',
      messages: enMessages,
    },
    {
      code: 'ja',
      flag: 'jp',
      name: 'japan',
      label: '日本語',
      messages: jaMessages,
    },
  ],
  messages: {
    zhHans: zhHansMessages,
    en: enMessages,
    ja: jaMessages,
  },
};
