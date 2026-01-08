import { PinterestBoard, PinterestSection, PinterestUser } from "../types";

const CLIENT_ID = '1542384';
// Updated to the user's requested redirect URL
const REDIRECT_URI = 'https://app.solosparkdigital.com/pinterest/callback';
const API_BASE = 'https://api.pinterest.com/v5';

export const pinterestService = {
  getRedirectUri: () => REDIRECT_URI,

  getAuthUrl: () => {
    const scope = 'boards:read,boards:write,pins:read,pins:write';
    const state = Math.random().toString(36).substring(7);
    // The redirect_uri parameter must be an EXACT match to what is registered in the Pinterest Dev Portal.
    return `https://www.pinterest.com/oauth/?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&state=${state}`;
  },

  setAccessToken: (token: string) => {
    localStorage.setItem('pinterest_access_token', token);
  },

  getAccessToken: () => {
    return localStorage.getItem('pinterest_access_token');
  },

  isConnected: () => {
    return !!localStorage.getItem('pinterest_access_token');
  },

  disconnect: () => {
    localStorage.removeItem('pinterest_access_token');
  },

  fetchUser: async (): Promise<PinterestUser> => {
    const token = pinterestService.getAccessToken();
    if (!token) throw new Error("Not authorized");

    const response = await fetch(`${API_BASE}/user_account`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error("Failed to fetch user profile");
    return await response.json();
  },

  fetchBoards: async (): Promise<PinterestBoard[]> => {
    const token = pinterestService.getAccessToken();
    if (!token) throw new Error("Not authorized");

    const response = await fetch(`${API_BASE}/boards`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error("Failed to fetch boards");
    const data = await response.json();
    return data.items || [];
  },

  fetchSections: async (boardId: string): Promise<PinterestSection[]> => {
    const token = pinterestService.getAccessToken();
    if (!token) return [];

    const response = await fetch(`${API_BASE}/boards/${boardId}/sections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.items || [];
  },

  createPin: async (params: {
    boardId: string;
    boardSectionId?: string;
    title: string;
    description: string;
    imageBase64: string;
    publishAt?: string;
  }) => {
    const token = pinterestService.getAccessToken();
    if (!token) throw new Error("Not authorized");

    // Remove the data URI prefix for the API
    const base64Data = params.imageBase64.split(',')[1] || params.imageBase64;

    const response = await fetch(`${API_BASE}/pins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        board_id: params.boardId,
        board_section_id: params.boardSectionId || undefined,
        title: params.title,
        description: params.description,
        media_source: {
          source_type: 'image_base64',
          content_type: 'image/png',
          data: base64Data
        },
        publish_at: params.publishAt || undefined
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create pin");
    }

    return await response.json();
  }
};