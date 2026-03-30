'use client'

import imageUrlBuilder from "@sanity/image-url";
import Image from "next/image";
import React, {FunctionComponent, useState} from 'react';
import { getImageDimensions } from '@sanity/asset-utils';
import styles from '../styles/Figure.module.scss';
import {sanityClient} from '../sanity/client';
import {classNames} from './utils/classNames';

const builder = imageUrlBuilder(sanityClient);

const sanityLoader = ({src, width, quality}: { src: string; width: number; quality?: number }) => {
    const url = new URL(src);
    url.searchParams.set('w', String(width));
    if (quality) url.searchParams.set('q', String(quality));
    return url.toString();
};

interface FigureProps {
    readonly image: any;
    readonly alt?: string
    readonly className?: string
    readonly sizes?: string
    readonly style?: React.CSSProperties
}


export const Figure: FunctionComponent<FigureProps> = ({image, alt, className, sizes, style}) => {
    const {width, height} = getImageDimensions(image);
    const [loaded, setLoaded] = useState<boolean>(false)

    return (
    <Image
        loader={sanityLoader}
        src={builder.image(image).auto("format").url()}
        sizes={sizes ?? "(max-width: 1024px) 110vw, 55vw"}
        width={width}
        height={height}
        alt={alt ?? ''}
        onLoad={() => setLoaded(true)}
        className={classNames([loaded ? styles.loaded : styles.loading, className])}
        style={style}
    />
  )
};