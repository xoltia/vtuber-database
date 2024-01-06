// Scrapes detailed data from for each VTuber from hololist.net
// Takes basic data from basic.ts and adds more detailed data
import * as cheerio from 'cheerio';
import type { VTuberBasicInfo } from './basic';

export type VTuberDetailedInfo = VTuberBasicInfo &  VTuberDetails;

type VTuberDetails = {
    youtube: string,
    originalName?: string,
    nicknames?: string[],
    birthday?: string,
    debutDate?: string,
    height?: string,
    weight?: string,
    zodiacSign?: string,
    group?: string,
    language?: string,
    gender?: string,
    oshiMark?: string,
    status?: string,
    streamTag?: string,
    artTag?: string,
    fanTag?: string,
    otherTags?: string[],
    twitter?: string,
}

export async function mapAsync<T, U>(
    array: T[],
    callback: (
        value: T,
        index: number,
        array: T[]
    ) => Promise<U>,
    limit: number = 10
): Promise<U[]> {
    const results: U[] = [];
    const promises: Promise<U>[] = [];
    let i = 0;

    while (i < array.length) {
        while (promises.length < limit && i < array.length) {
            promises.push(callback(array[i], i, array));
            i++;
        }

        results.push(...await Promise.all(promises));
        promises.length = 0;
    }

    return results;
}

async function getDetailsFromBasicInfo(info: VTuberBasicInfo): Promise<VTuberDetailedInfo> {
    const detailsPage = await fetch(info.url);
    const detailsHtml = await detailsPage.text();
    const $ = cheerio.load(detailsHtml);

    let originalName = '';

    if ($('div#original-name').length > 0) {
        originalName = $('div#original-name').text().split('\n')[2].trim();
    }

    let nicknames: string[] = [];

    if ($('div#nickname').length > 0) {
        nicknames = $('div#nickname > div').text().split('\n');
    }

    const birthday = $('div#birthday > div > span').first().text();
    const debutDate = $('div#debut > div > span').first().text();
    const height = $('div#height').text().split('\n')[2].trim();
    const weight = $('div#weight').text().split('\n')[2].trim();
    const zodiacSign = $('div#zodiac > a').text();
    const group = $('div#group > a').text();
    const language = $('div#language > a').text();
    const gender = $('div#gender > a').text();
    const oshiMark = $('div#oshi-mark').text().split('\n')[2].trim();
    const status = $('div#status').text().split('\n')[2].trim();
    
    let streamTag = '';
    let artTag = '';
    let fanTag = '';
    const otherTags: string[] = [];

    $('div#hashtags > div.mb-3 > div.py-1').each((_, element) => {
        const tag = $(element).find('a').text();
        const tagType = $(element).text().split('-')[1].trim();

        if (tagType === 'Live') {
            if (streamTag) {
                otherTags.push(streamTag);
                return;
            }
            streamTag = tag;
        } else if (tagType === 'Fanart') {
            if (artTag) {
                otherTags.push(artTag);
                return;
            }
            artTag = tag;
        } else if (tagType === 'Fans') {
            if (fanTag) {
                otherTags.push(fanTag);
                return;
            }
            fanTag = tag;
        } else {
            otherTags.push(tag);
        }
    })

    const channelsHeader = $('h3.fs-6.mb-2:contains("Channels")');
    const channelLinks = channelsHeader.siblings('.d-flex').find('a').map((_, element) => $(element).attr('href')).get();
    const socialsHeader = $('h3.fs-6.mb-2:contains("Socials")');
    const socialLinks = socialsHeader.siblings('.d-flex').find('a').map((_, element) => $(element).attr('href')).get();

    let youtube = '';

    for (const link of channelLinks) {
        if (link.includes('youtube')) {
            youtube = new URL(link).pathname.split('/')[2];
            break;
        }
    }

    let twitter = '';

    for (const link of socialLinks) {
        if (link.includes('twitter')) {
            twitter = new URL(link).pathname.split('/')[1];
            break;
        }
    }

    return {
        ...info,
        originalName,
        nicknames,
        birthday,
        debutDate,
        height,
        weight,
        zodiacSign,
        group,
        language,
        gender,
        oshiMark,
        status,
        streamTag,
        fanTag,
        artTag,
        otherTags,
        youtube,
        twitter,
    };
}

function removeEmptyFields<T extends Record<string, any>>(obj: T, ...zeroValues: any[]): T {
    const newObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined ||
            value === null ||
            zeroValues.includes(value) ||
            Array.isArray(value) && value.length === 0
        ) {
            continue;
        }

        newObj[key] = value;
    }

    return newObj as T;
}

const inputFile = Bun.file('vtubers-basic.json');
const vtubers = await inputFile.json<VTuberBasicInfo[]>();
const detailedVtubers = await mapAsync(vtubers, function(vtuber, index) {
    console.log(`Fetching details for ${vtuber.name} (${index + 1}/${vtubers.length})`);

    try {
        return getDetailsFromBasicInfo(vtuber);
    } catch (error) {
        console.error(`Error fetching details for ${vtuber.name}`);
        throw error;
    }
}, 25);

const cleanedVtubers = detailedVtubers.map(vtuber => removeEmptyFields(vtuber, '', '....'));
await Bun.write('vtubers-detailed.json', JSON.stringify(cleanedVtubers, null, 2));
