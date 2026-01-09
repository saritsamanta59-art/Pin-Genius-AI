import { PinterestBoard, PinterestSection, PinterestUser } from "../types";

// Your provided Pinterest App Credentials
const CLIENT_ID = '1542384';
// Note: Client Secret is typically used server-side, but kept here for reference if you have a proxy.
// For pure client-side apps, we use the Implicit Flow or a PKCE-like approach if supported.
const CLIENT_SECRET = 'f3278a00950d7343e49d7a137c66640bd5fd3de7';

// This MUST match exactly what you have in the Pinterest Developer Portal
const REDIRECT_URI = 'https://solosparkdigital.net/pinterest-callback';
const API_BASE = 'https://api.pinterest.com/v5';

export const pinterestService = {
  getRedirectUri: () => REDIRECT_URI,
  getClientId: () => CLIENT_ID,

  getAuthUrl: () => {
    const scope = 'boards:read,boards:write,pins:read,pins:write';
    const state = Math.random().toString(36).substring(7);
    
    // Pinterest V5 OAuth URL
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code', // or 'token' for implicit
      scope: scope,
      state: state
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  },

  setAccessToken: (token: string) => {
    localStorage.setItem('pinterest_access_token', token);
  },

  getAccessToken: () => {
    return localStorage.getItem('pinterest_access_token');
  },

  isConnected: () => {
    const token = localStorage.getItem('pinterest_access_token');
    return !!token && token.length > 10;
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
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Pinterest session expired.");
    }
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

    const base64Data = params.imageBase64.includes(',') 
      ? params.imageBase64.split(',')[1] 
      : params.imageBase64;

    const body: any = {
      board_id: params.boardId,
      title: params.title.substring(0, 100),
      description: params.description.substring(0, 500),
      media_source: {
        source_type: 'image_base64',
        content_type: 'image/png',
        data: base64Data
      }
    };

    if (params.boardSectionId) body.board_section_id = params.boardSectionId;
    if (params.publishAt) body.publish_at = params.publishAt;

    const response = await fetch(`${API_BASE}/pins`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create pin");
    }

    return await response.json();
  }
};