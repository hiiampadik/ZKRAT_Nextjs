import React from 'react';
import Head from "next/head";
import { ProjectItem } from '../sanity/queries';

interface LayoutProps {
    children: React.ReactNode;
    projects?: ProjectItem[];
}

export default function Layout({ children, projects }: LayoutProps) {

    const title = 'Zkrat Kolektiv'
    const description = "Zkrat is collective of multidisciplinatory artists based in Brno (CZE)"
    const keyWords = "Interactive, Installations, Visualizations, Zkrat, Zkrat Kolektiv, Zkrat PDF, Zkrat Collective, Collective, zkrat.pdf, @zkrat.pdf, @zkrat.kolektiv"

    const baseURL = 'https://zkratkolektiv.com/'
    const imageUlr = baseURL + 'zkrat.jpg'

    const projectGraphItems = (projects ?? [])
        .filter(p => p.coverSanityUrl)
        .map(p => ({
            "@type": "CreativeWork",
            "name": p.titleEn ?? p.titleCs ?? undefined,
            "url": p.slug ? baseURL + 'project/' + p.slug : baseURL,
            "image": p.coverSanityUrl,
            "dateCreated": p.year?.toString(),
            "creator": {"@id": baseURL + "#organization"},
        }))

    const jsonLd = {
        '@context': 'https://schema.org',
        "@graph":[
            {
                "@type":"Organization",
                "@id": baseURL + "#organization",
                "name":"Zkrat Kolektiv",
                "url":baseURL,
                "sameAs":["https://www.instagram.com/zkrat.kolektiv/"]
            },
            {
                "@type":"WebSite",
                "@id": baseURL + "#website",
                "url": baseURL,
                "name": title,
                "publisher": {"@id":"https://zkratkolektiv.com#organization"},
                'description': description
            },
            ...projectGraphItems
        ]
    }

    return (
        <>
            <Head>
                <title>{title}</title>

                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta name="keywords" content={keyWords}/>
                <meta name="description" content={description}/>
                <meta name="robots" content="index, follow"/>
                <meta charSet="utf-8"/>

                <meta property="og:site_name" content={title}/>
                <meta property="og:title" content={title}/>
                <meta property="og:description" content={description}/>
                <meta property="og:type" content="website"/>
                <meta property="og:url" content={baseURL}/>

                <meta property="og:image" content={imageUlr}/>
                <meta property="og:image:type" content="image/jpg"/>
                <meta property="og:image:width" content={"1920"}/>
                <meta property="og:image:height" content={"1080"}/>

                <meta name="twitter:image" content={imageUlr}/>
                <meta name="twitter:image:type" content="image/jpg"/>
                <meta name="twitter:image:width" content={"1920"}/>
                <meta name="twitter:image:height" content={"1080"}/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content={title}/>
                <meta name="twitter:description" content={description}/>

                <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96"/>
                <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg"/>
                <link rel="shortcut icon" href="/favicon/favicon.ico"/>
                <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png"/>
                <meta name="apple-mobile-web-app-title" content="Zkrat Kol."/>
                <link rel="manifest" href="/favicon/site.webmanifest" />
            </Head>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
            />

            <main>
                {children}
            </main>
        </>
    );
}
