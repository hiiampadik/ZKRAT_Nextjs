import type { AppProps } from 'next/app'
import '../styles/globals.css'
import 'swiper/css'
import 'swiper/css/scrollbar'
import 'swiper/css/mousewheel'

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
