# vtuber-database

## About
This is a database of vtubers in JSON format. It is generated from data on hololist.net and the YouTube API.

## Format

### Basic
```ts
{
    name: string,
    url: string,
    image: string,
    affiliation: string,
}
```

### Detailed
```ts
{
    ...Basic,
    youtube?: string,
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
```

### Detailed with YouTube
```ts
{
    ...Detailed,
    youtubeName?: string,
    youtubeThumbnail?: string,
    youtubeHandle?: string,
}
```

## Generating Files

To install dependencies:

```bash
bun install
```

To run:

```bash
 # outputs to vtubers.json
bun run basic.ts

 # reads from vtubers.json and outputs to vtubers-detailed.json
bun run detailed.ts

# reads from vtubers-detailed.json and outputs to vtubers-detailed-with-youtube.json
# requires a YouTube API key in the environment variable GOOGLE_API_KEY
bun run yt-details.ts 
```
