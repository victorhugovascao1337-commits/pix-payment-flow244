import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title:
    "Panini Copa 2026 - Álbum Oficial FIFA World Cup | Compre Agora",
  description:
    "Garanta seu álbum oficial da Copa do Mundo 2026 com figurinhas. Kits com até 55% de desconto. Frete grátis para todo o Brasil!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Facebook Pixel */}
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
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ""}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        {/* UTMFY Pixel */}
        <script
          id="utmify-pixel"
          dangerouslySetInnerHTML={{
            __html: `
              window.pixelId = "698acbb18b2628d6aab9e885";
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
          data-utmify-prevent-xcod-sck
          data-utmify-prevent-subids
          async
          defer
        />
        {/* UTM Params Capture Script - Preserves UTM params from Facebook Ads and other sources */}
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
                  
                  // Save UTM params if any exist (even if empty strings, we'll filter later)
                  var hasUTM = utmData.utm_source || utmData.utm_campaign || utmData.utm_medium || 
                                utmData.utm_content || utmData.utm_term || utmData.src || utmData.sck;
                  
                  if (hasUTM) {
                    var cleanUtmData = {};
                    Object.keys(utmData).forEach(function(key) {
                      if (utmData[key]) {
                        cleanUtmData[key] = utmData[key];
                      }
                    });
                    
                    if (Object.keys(cleanUtmData).length > 0) {
                      localStorage.setItem('panini_utm_params', JSON.stringify(cleanUtmData));
                      console.log('[UTMIFY] ✅ UTM parameters saved:', cleanUtmData);
                    }
                  }
                } catch (error) {
                  console.error('[UTMIFY] ❌ Error saving UTM parameters:', error);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
