/**
 * Client-callable public Twitch GQL helpers — no auth, uses the shared
 * public client ID. Ported from index.html:3400-3627 and
 * audio-probe.js:158-216, with the new fragmented-MP4 init-segment parsing
 * added to parseMediaPlaylist (see note below, per specs.md §4).
 */

import type { ChatComment, HlsMediaPlaylist, HlsVariant, VodSummary } from "./types";

export const GQL_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
const GQL_ENDPOINT = "https://gql.twitch.tv/gql";
const CHAT_PERSISTED_QUERY_OP = "VideoCommentsByOffsetOrCursor";
const CHAT_PERSISTED_QUERY_SHA256 = "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a";
const PLAYBACK_TOKEN_OP = "PlaybackAccessToken";
const PLAYBACK_TOKEN_SHA256 = "0828119ded1c13477966434e15800ff57ddacf13ba1911c129dc2200705b0712";
const MAX_CHAT_PAGES = 400; // safety cap, index.html:3572

/** POSTs to gql.twitch.tv/gql with the shared public client id. Ported from index.html:3557-3565. */
export async function gql<T>(body: unknown): Promise<T> {
  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Id": GQL_CLIENT_ID },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GQL ${res.status}`);
  return res.json() as Promise<T>;
}

interface GqlVideoNode {
  id: string;
  title: string;
  broadcastType: string;
  lengthSeconds: number;
  previewThumbnailURL: string;
  viewCount: number;
  createdAt: string;
  owner: { login: string; displayName: string } | null;
}

interface ChannelVideosResponse {
  data?: { user: { videos: { edges: { node: GqlVideoNode }[] } } | null };
}

/** Inline-query VOD list for a channel — inline (not persisted) since persisted hashes rotate. Ported from index.html:3400-3433. */
export async function fetchChannelVods(login: string): Promise<VodSummary[]> {
  const body = {
    query: `query ChannelVideos($login: String!, $limit: Int!) {
      user(login: $login) {
        videos(first: $limit, sort: TIME) {
          edges {
            node {
              id
              title
              broadcastType
              lengthSeconds
              previewThumbnailURL(width: 640, height: 360)
              viewCount
              createdAt
              owner { login displayName }
            }
          }
        }
      }
    }`,
    variables: { login, limit: 12 },
  };

  const res = await gql<ChannelVideosResponse | ChannelVideosResponse[]>(body);
  const single = Array.isArray(res) ? res[0] : res;
  const user = single?.data?.user;
  if (!user) return [];

  return user.videos.edges
    .map((edge) => edge.node)
    .filter((node): node is GqlVideoNode => Boolean(node))
    .map((node) => ({
      id: node.id,
      title: node.title,
      broadcastType: node.broadcastType,
      lengthSeconds: node.lengthSeconds,
      previewThumbnailURL: node.previewThumbnailURL,
      viewCount: node.viewCount,
      createdAt: node.createdAt,
      ownerLogin: node.owner?.login ?? "",
      ownerDisplayName: node.owner?.displayName ?? "",
    }));
}

interface GqlCommentFragment {
  text?: string;
  emote?: { emoteID: string };
}
interface GqlCommentNode {
  contentOffsetSeconds: number;
  commenter?: { displayName?: string };
  message?: {
    fragments?: GqlCommentFragment[];
    userBadges?: { setID: string; version: string }[];
  };
}
interface GqlCommentsResponse {
  data?: {
    video?: {
      comments?: {
        edges?: { node: GqlCommentNode; cursor: string }[];
        pageInfo?: { hasNextPage: boolean };
      };
    };
  };
}

/** Cursor-paginated chat replay fetch via the public persisted VideoComments query. Ported from index.html:3567-3627. */
export async function fetchAllChat(vodId: string): Promise<ChatComment[]> {
  const comments: ChatComment[] = [];
  let cursor: string | null = null;
  let pages = 0;

  while (pages < MAX_CHAT_PAGES) {
    const requestBody: unknown[] = [
      {
        operationName: CHAT_PERSISTED_QUERY_OP,
        variables: cursor ? { cursor } : { videoID: vodId, contentOffsetSeconds: 0 },
        extensions: { persistedQuery: { version: 1, sha256Hash: CHAT_PERSISTED_QUERY_SHA256 } },
      },
    ];

    let comments_: { edges?: { node: GqlCommentNode; cursor: string }[]; pageInfo?: { hasNextPage: boolean } } | undefined;
    try {
      const j: GqlCommentsResponse[] = await gql<GqlCommentsResponse[]>(requestBody);
      comments_ = j[0]?.data?.video?.comments;
    } catch (e) {
      throw new Error(`Chat fetch failed: ${(e as Error).message}`);
    }
    if (!comments_) break;

    (comments_.edges || []).forEach((edge) => {
      const n = edge.node;
      if (!n) return;
      const fragments = n.message?.fragments || [];
      const text = fragments.map((f) => f.text || "").join("");
      const emotes = fragments
        .filter((f) => f.emote)
        .map((f) => ({ id: f.emote!.emoteID, name: f.text || "?" }));
      const badges = (n.message?.userBadges || []).map((b) => b.setID);

      comments.push({
        t: n.contentOffsetSeconds,
        user: n.commenter?.displayName || "anon",
        msg: text,
        emotes,
        badges,
        isSubscriber: badges.includes("subscriber"),
        isMod: badges.includes("moderator"),
        isVIP: badges.includes("vip"),
      });
    });

    if (!comments_.pageInfo?.hasNextPage) break;
    const nextCursor: string | undefined = comments_.edges?.[comments_.edges.length - 1]?.cursor;
    if (!nextCursor) break;
    cursor = nextCursor;
    pages++;
  }

  return comments;
}

interface PlaybackToken {
  signature: string;
  value: string;
}
interface PlaybackTokenResponse {
  data?: { videoPlaybackAccessToken?: PlaybackToken };
}

/** Ported from audio-probe.js:158-168. */
export async function getVodPlaybackToken(vodId: string): Promise<PlaybackToken> {
  const body = [
    {
      operationName: PLAYBACK_TOKEN_OP,
      variables: { isLive: false, login: "", isVod: true, vodID: vodId, playerType: "embed" },
      extensions: { persistedQuery: { version: 1, sha256Hash: PLAYBACK_TOKEN_SHA256 } },
    },
  ];
  const j = await gql<PlaybackTokenResponse[]>(body);
  const tok = j[0]?.data?.videoPlaybackAccessToken;
  if (!tok) throw new Error("Could not get playback token");
  return tok;
}

/** Ported from audio-probe.js:169-173. */
export function getVodPlaylistUrl(token: PlaybackToken, vodId: string): string {
  return `https://usher.ttvnw.net/vod/${vodId}.m3u8?allow_source=true&sig=${encodeURIComponent(token.signature)}&token=${encodeURIComponent(token.value)}`;
}

/** Ported from audio-probe.js:189-201, extended with RESOLUTION/NAME per index.html:5751-5761. */
export function parseMasterPlaylist(text: string): HlsVariant[] {
  const lines = text.split("\n");
  const variants: HlsVariant[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXT-X-STREAM-INF")) {
      const info = lines[i];
      const uri = (lines[i + 1] || "").trim();
      const bandwidth = +((info.match(/BANDWIDTH=(\d+)/) || [])[1] || 0);
      const res = (info.match(/RESOLUTION=(\S+)/) || [])[1];
      const name = (info.match(/VIDEO="([^"]+)"/) || [])[1] || (info.match(/NAME="([^"]+)"/) || [])[1];
      variants.push({ uri, bandwidth, res, name });
    }
  }
  return variants;
}

/**
 * NEW parser (specs.md §4 "NEW parser note"): the old parseMediaPlaylist
 * (audio-probe.js:202-216) did not capture the init segment, since the old
 * pipeline transmuxed raw TS. The fragmented-MP4 pipeline needs the
 * `#EXT-X-MAP:URI="..."` init segment resolved against baseUrl, in addition
 * to the fragment (#EXTINF) lines — both resolved the same way.
 */
export function parseMediaPlaylist(text: string, baseUrl: string): HlsMediaPlaylist {
  const lines = text.split("\n");
  const segments: { uri: string; duration: number }[] = [];
  let initUri: string | null = null;
  let dur = 0;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (l.startsWith("#EXT-X-MAP:")) {
      const match = l.match(/URI="([^"]+)"/);
      if (match) initUri = new URL(match[1], baseUrl).href;
    } else if (l.startsWith("#EXTINF:")) {
      dur = parseFloat(l.slice(8).split(",")[0]);
    } else if (l && !l.startsWith("#")) {
      segments.push({ uri: new URL(l, baseUrl).href, duration: dur });
      dur = 0;
    }
  }

  return { initUri, segments };
}
