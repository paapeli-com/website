// app/fonts.ts
import { Poppins, Tajawal, Vazirmatn } from 'next/font/google'

/** Latin UI font. The `variable` also lets single elements opt in inside
  * the Persian and Arabic pages, which is how the wordmark stays Poppins. */
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
})

export const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
})
