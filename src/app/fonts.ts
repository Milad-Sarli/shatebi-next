import localFont from 'next/font/local'

export const pinar = localFont({
  src: [
    {
      path: '../../public/fonts/Pinar-DS2-FD-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pinar-DS2-FD-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Pinar-DS2-FD-ExtraBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-pinar',
  display: 'swap',
}) 