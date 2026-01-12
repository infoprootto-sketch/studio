
export interface Language {
  name: string;
  code: string;
}

export interface Currency {
  name: string;
  code: string;
  symbol: string;
}

export interface Country {
  name: string;
  code: string;
  currencies: Currency[];
  languages: Language[];
}

export const allCurrencies: Record<string, Currency> = {
  'USD': { name: 'United States Dollar', code: 'USD', symbol: '$' },
  'CAD': { name: 'Canadian Dollar', code: 'CAD', symbol: '$' },
  'GBP': { name: 'British Pound', code: 'GBP', symbol: '£' },
  'AUD': { name: 'Australian Dollar', code: 'AUD', symbol: '$' },
  'EUR': { name: 'Euro', code: 'EUR', symbol: '€' },
  'JPY': { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  'INR': { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  'BRL': { name: 'Brazilian Real', code: 'BRL', symbol: 'R$' },
  'ZAR': { name: 'South African Rand', code: 'ZAR', symbol: 'R' },
};

export const allLanguages: Record<string, Language> = {
    'en': { name: 'English', code: 'en' },
    'es': { name: 'Spanish', code: 'es' },
    'fr': { name: 'French', code: 'fr' },
    'de': { name: 'German', code: 'de' },
    'ja': { name: 'Japanese', code: 'ja' },
    'hi': { name: 'Hindi', code: 'hi' },
    'pt': { name: 'Portuguese', code: 'pt' },
    'af': { name: 'Afrikaans', code: 'af' },
    'zu': { name: 'Zulu', code: 'zu' },
};


export const countries: Country[] = [
  { 
    name: 'United States', 
    code: 'US',
    currencies: [allCurrencies['USD']],
    languages: [allLanguages['en'], allLanguages['es']]
  },
  { 
    name: 'Canada', 
    code: 'CA',
    currencies: [allCurrencies['CAD']],
    languages: [allLanguages['en'], allLanguages['fr']]
  },
  { 
    name: 'United Kingdom', 
    code: 'GB',
    currencies: [allCurrencies['GBP']],
    languages: [allLanguages['en']]
  },
  { 
    name: 'Australia', 
    code: 'AU',
    currencies: [allCurrencies['AUD']],
    languages: [allLanguages['en']]
  },
  { 
    name: 'Germany', 
    code: 'DE',
    currencies: [allCurrencies['EUR']],
    languages: [allLanguages['de'], allLanguages['en']]
  },
  { 
    name: 'France', 
    code: 'FR',
    currencies: [allCurrencies['EUR']],
    languages: [allLanguages['fr'], allLanguages['en']]
  },
  { 
    name: 'Japan', 
    code: 'JP',
    currencies: [allCurrencies['JPY']],
    languages: [allLanguages['ja']]
  },
  { 
    name: 'India', 
    code: 'IN',
    currencies: [allCurrencies['INR']],
    languages: [allLanguages['hi'], allLanguages['en']]
  },
  { 
    name: 'Brazil', 
    code: 'BR',
    currencies: [allCurrencies['BRL']],
    languages: [allLanguages['pt'], allLanguages['es']]
  },
  { 
    name: 'South Africa', 
    code: 'ZA',
    currencies: [allCurrencies['ZAR']],
    languages: [allLanguages['en'], allLanguages['af'], allLanguages['zu']]
  },
];

export const currencies = Object.values(allCurrencies);
export const languages = Object.values(allLanguages);
