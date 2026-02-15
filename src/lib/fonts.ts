import { Hind_Siliguri, Noto_Sans_Bengali, Lato, Roboto, Open_Sans, Orbitron, Montserrat } from 'next/font/google';

export const hind_siliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});
export const noto_sans_bengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '700'],
  variable: '--font-noto-sans-bengali',
  display: 'swap',
});
export const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
  display: 'swap',
});
export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
  display: 'swap',
});
export const open_sans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});
export const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron',
  display: 'swap',
});
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const fontMap: Record<string, { variable: string }> = {
  'Hind Siliguri': hind_siliguri,
  'Noto Sans Bengali': noto_sans_bengali,
  'Lato': lato,
  'Roboto': roboto,
  'Open Sans': open_sans,
  'Orbitron': orbitron,
  'Montserrat': montserrat,
};

export const allFontVariables = Object.values(fontMap).map(f => f.variable).join(' ');
