import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// upload image
export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
    });
    return response.json();
};
export function combineDateAndTime(date: Date, time: string) {
    const match = time.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
    if (!match) return date;

    const hh = Number(match[1]);
    const mm = Number(match[2]);
    const ampm = match[3];

    let hours24 = hh % 12;
    if (ampm === 'PM') hours24 += 12;

    const combined = new Date(date);
    combined.setHours(hours24, mm, 0, 0);
    return combined;
}
