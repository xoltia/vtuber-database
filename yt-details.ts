import type { VTuberDetailedInfo } from './detailed';

type YoutubeChannelDetailsResponse = {
    items: YoutubeChannelDetails[],
}

type YoutubeChannelDetails = {
    id: string,
    snippet: {
        title: string,
        description: string,
        publishedAt: string,
        customUrl: string,
        thumbnails: {
            default: {
                url: string,
            },
            medium: {
                url: string,
            },
            high: {
                url: string,
            },
        },
    },
}

type YoutubeInfo = {
    youtubeName: string,
    youtubeThumbnail: string,
    youtubeHandle: string,
}

type VTuberDetailedWithYoutube = VTuberDetailedInfo & YoutubeInfo;

async function fetchYoutubeChannelDetails(...id: string[]): Promise<YoutubeChannelDetails[]> {
    const response = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?' +
            `key=${process.env.GOOGLE_API_KEY}&` +
            `id=${id.join(',')}&` +
            'part=snippet,contentDetails'
    );

    return response
        .json<YoutubeChannelDetailsResponse>()
        .then(response => response.items);
}


const inputFile = Bun.file('vtubers-detailed.json');
const vtubers = await inputFile.json<VTuberDetailedInfo[]>();
console.log(`Found ${vtubers.length} vtubers`);
const vtubersWithYoutube = vtubers.filter(vtuber => !!vtuber.youtube);
console.log(`Found ${vtubersWithYoutube.length} vtubers with youtube`);
const maxBatchSize = 50;
const batches: string[][] = [];

for (let i = 0; i < vtubers.length; i += maxBatchSize) {
    batches.push(
        vtubersWithYoutube
            .slice(i, i + maxBatchSize)
            .map(vtuber => vtuber.youtube)
    );
}

console.log(`Split into ${batches.length} batches`);

const channelInfo: Record<string, YoutubeInfo> = {};

for (let i = 0; i < batches.length; i += 1) {
    console.log(`Fetching batch ${i + 1}/${batches.length}`);

    const batch = batches[i];

    console.log(`Fetching ${batch.length} channels`);

    const details = await fetchYoutubeChannelDetails(...batch);

    for (const detail of details) {
        channelInfo[detail.id] = {
            youtubeName: detail.snippet.title,
            youtubeThumbnail: detail.snippet.thumbnails.high.url,
            youtubeHandle: detail.snippet.customUrl,
        };
    }
}

const output: (VTuberDetailedInfo | VTuberDetailedWithYoutube)[] = [];

for (const vtuber of vtubers) {
    if (!vtuber.youtube) {
        output.push(vtuber);
        continue;
    }

    output.push({
        ...vtuber,
        ...channelInfo[vtuber.youtube],
    });
}

await Bun.write('vtubers-detailed-with-youtube.json', JSON.stringify(output, null, 2));