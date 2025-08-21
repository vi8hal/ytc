
'use server';

import { google } from 'googleapis';

export async function searchChannels(apiKey: string, query: string) {
  if (!query || !apiKey) return [];
  try {
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults: 10,
    });

    const channels = response.data.items?.map(item => ({
      id: item.id?.channelId || '',
      name: item.snippet?.title || 'Untitled Channel',
      thumbnail: item.snippet?.thumbnails?.default?.url || `https://placehold.co/88x88.png`,
    })).filter(c => c.id) || [];
    
    return channels;

  } catch (error: any) {
    if (error.code === 400 && error.errors?.[0]?.reason === 'keyInvalid') {
        throw new Error('Your YouTube API Key is invalid. Please check it in the Google Cloud Console and save it again.');
    }
     if (error.message.includes('User not authenticated') || error.message.includes('YouTube API Key not configured')) {
      throw error;
    }
    console.error("[YOUTUBE_SEARCH_ERROR]", error.errors || error.message);
    // Return an empty array on failure to prevent crashes on the client side.
    // The component will handle displaying the error message thrown from here.
    throw new Error('Failed to search for channels. Please check your API key and permissions.');
  }
}

export async function getChannelVideos(apiKey: string, channelId: string) {
  if (!channelId || !apiKey) return [];
  try {
    const youtube = google.youtube({ version: 'v3', auth: apiKey });

    const response = await youtube.search.list({
      part: ['snippet'],
      channelId: channelId,
      type: ['video'],
      maxResults: 20,
      order: 'date',
    });

    const videos = response.data.items?.map(item => ({
      id: item.id?.videoId || '',
      title: item.snippet?.title || 'Untitled Video',
    })).filter(v => v.id) || [];
    
    return videos;
  } catch (error: any) {
     if (error.code === 400 && error.errors?.[0]?.reason === 'keyInvalid') {
        throw new Error('Your YouTube API Key is invalid. Please check it in the Google Cloud Console and save it again.');
    }
    console.error("[YOUTUBE_VIDEO_FETCH_ERROR]", error.errors || error.message);
    throw new Error('Failed to fetch videos. The selected channel may have disabled API access or your API key is invalid.');
  }
}
