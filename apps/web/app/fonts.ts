// app/fonts.ts
import { Inter, Tajawal, Vazirmatn } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
})

export const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
})
