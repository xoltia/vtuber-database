// Scrapes basic data from hololist.net
import * as cheerio from 'cheerio';

export type VTuberBasicInfo = {
    name: string,
    url: string,
    image: string,
    affiliation: string,
}

async function getTopVtubersPage(pageNumber: Number): Promise<VTuberBasicInfo[]> {
    const response = await fetch(`https://hololist.net/top/page/${pageNumber}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    const vtubers: VTuberBasicInfo[] = [];

    $('.d-flex.mb-4.rounded').each((index, element) => {
        const name = $(element).find('span[itemprop="name"]').text();
        const affiliation = $(element).find('div[itemprop="affiliation"]').text();
        const url = $(element).find('a.line-truncate').attr('href');
        const image = $(element).find('img.lazy-image.me-2.border.rounded-circle').attr('data-src');

        if (!url) {
            console.warn(`No url found for ${name}`);
            return;
        }

        if (!image) {
            console.warn(`No image found for ${name}`);
            return;
        }

        vtubers.push({
            name,
            url,
            image,
            affiliation,
        });
    });

    return vtubers;
}

const vtubers: VTuberBasicInfo[] = [];

for (let i = 1; ; i++) {
    console.log(`Fetching page ${i}`);
    const page = await getTopVtubersPage(i);
    if (page.length === 0) {
        break;
    }
    vtubers.push(...page);
}

await Bun.write('vtubers-basic.json', JSON.stringify(vtubers, null, 2));
