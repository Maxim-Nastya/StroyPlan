import type { User, Project, DirectoryItem, UserProfile, EstimateTemplate, InventoryItem, ProjectNote, Estimate } from './types';

const BASE_URL = 'https://api.prorab.app'; // This now points to the production backend API.
let token: string | null = null;

export const setToken = (newToken: string | null) => {
    token = newToken;
};

const _fetch = async (endpoint: string, options: RequestInit = {}) => {
    // The Headers constructor correctly handles all variants of HeadersInit.
    // We start with a default Content-Type and then merge/overwrite with any provided headers.
    const headers = new Headers({
        'Content-Type': 'application/json',
    });

    if (options.headers) {
        new Headers(options.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Ошибка API');
    }

    // Handle responses with no content
    if (response.status === 204) {
        return null;
    }
    
    return response.json();
};


export const api = {
    async login(email: string, password: string): Promise<{ user: User, token: string }> {
        return _fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async register(email: string, password: string): Promise<{ user: User, token: string }> {
         return _fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    async getInitialData(): Promise<{ user: User, projects: Project[], directory: DirectoryItem[], profile: UserProfile, templates: EstimateTemplate[], inventory: InventoryItem[], inventoryNotes: ProjectNote[] }> {
        const [user, projects, directory, profile, templates, inventory, inventoryNotes] = await Promise.all([
            _fetch('/api/user'),
            _fetch('/api/projects'),
            _fetch('/api/directory'),
            _fetch('/api/profile'),
            _fetch('/api/templates'),
            _fetch('/api/inventory'),
            _fetch('/api/inventory-notes'),
        ]);
        return { user, projects, directory, profile, templates, inventory, inventoryNotes };
    },
    
    async getPublicEstimateData(projectId: string, estimateId: string): Promise<{ project: Project, estimate: Estimate }> {
        return _fetch(`/api/public/estimate?projectId=${projectId}&estimateId=${estimateId}`);
    },

    async approvePublicEstimate(projectId: string, estimateId: string): Promise<{ success: boolean }> {
        return _fetch('/api/public/estimate/approve', {
            method: 'POST',
            body: JSON.stringify({ projectId, estimateId }),
        });
    },

    async saveProjects(data: Project[]): Promise<void> {
        await _fetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async saveDirectory(data: DirectoryItem[]): Promise<void> {
        await _fetch('/api/directory', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async saveProfile(data: UserProfile): Promise<void> {
        await _fetch('/api/profile', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async saveTemplates(data: EstimateTemplate[]): Promise<void> {
        await _fetch('/api/templates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async saveInventory(data: InventoryItem[]): Promise<void> {
        await _fetch('/api/inventory', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async saveInventoryNotes(data: ProjectNote[]): Promise<void> {
        await _fetch('/api/inventory-notes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    async activateSubscription(): Promise<User> {
        return _fetch('/api/subscription/activate', {
            method: 'POST',
        });
    }
};
