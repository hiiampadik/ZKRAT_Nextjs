type ClassNames = Array<string | false | null | undefined>;
export const classNames = (classNames: ClassNames): string => classNames.filter(Boolean).join(' ');
