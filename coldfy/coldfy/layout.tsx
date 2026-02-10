import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Wepink - Site Oficial",
  description: "Wepink - Perfumes e Body Splash com as melhores ofertas",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-696514603" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-696514603');
            `,
          }}
        />
        {/* End Google Tag */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ""}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var urlParams = new URLSearchParams(window.location.search);
                  var utmData = {
                    utm_source: urlParams.get('utm_source') || '',
                    utm_medium: urlParams.get('utm_medium') || '',
                    utm_campaign: urlParams.get('utm_campaign') || '',
                    utm_term: urlParams.get('utm_term') || '',
                    utm_content: urlParams.get('utm_content') || '',
                    src: urlParams.get('src') || '',
                    sck: urlParams.get('sck') || ''
                  };
                  
                  if (utmData.utm_source || utmData.utm_campaign || utmData.src) {
                    localStorage.setItem('wepink_utm_params', JSON.stringify(utmData));
                    console.log('[v0] UTM parameters saved:', utmData);
                  }
                } catch (error) {
                  console.error('[v0] Error saving UTM parameters:', error);
                }
              })();
            `,
          }}
        />
        <script
          id="utmify-pixel"
          dangerouslySetInnerHTML={{
            __html: `
              window.pixelId = "695c724b023ffb1648c0f6f2";
              var a = document.createElement("script");
              a.setAttribute("async", "");
              a.setAttribute("defer", "");
              a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
              document.head.appendChild(a);
            `,
          }}
        />
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-token={process.env.NEXT_PUBLIC_UTMIFY_TOKEN || ""}
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          async
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeWatermark() {
                  var elements = document.querySelectorAll('[id^="v0-built-with-button"]');
                  elements.forEach(function(el) { el.remove(); });
                  var badges = document.querySelectorAll('a[href*="v0.app"]');
                  badges.forEach(function(el) {
                    if (el.textContent && el.textContent.includes('Built with')) {
                      el.closest('div[style*="position: fixed"]')?.remove();
                    }
                  });
                }
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', removeWatermark);
                } else {
                  removeWatermark();
                }
                setInterval(removeWatermark, 500);
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
