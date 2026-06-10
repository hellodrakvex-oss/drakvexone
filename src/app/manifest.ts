import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Drakvex One',
    short_name: 'Drakvex',
    description: 'Premium mobile-first SaaS dashboard for modern shops.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1625',
    theme_color: '#1a1625',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
