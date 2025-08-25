
import React, { useState, useEffect, useMemo, createContext, useContext, useCallback, Dispatch, SetStateAction } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

// --- PWA Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('Service Worker registered: ', registration);
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}

// --- ICONS ---
const LogoIcon = ({ size = 32 }: { size?: number }) => (
    <img src="./logo.svg" alt="Логотип Прораб" width={size} height={size} className="app-logo-img" />
);
const EditIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/></svg>;
const DeleteIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor"/></svg>;
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor"/></svg>;
const ReplayIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5V1L7 6L12 11V8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20C8.69 20 6 17.31 6 14H4C4 18.42 7.58 22 12 22C16.42 22 20 18.42 20 14C20 9.58 16.42 6 12 6Z" fill="currentColor"/></svg>;
const PrintIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 8H5C3.34 8 2 9.34 2 11V17H6V21H18V17H22V11C22 9.34 20.66 8 19 8ZM16 19H8V14H16V19ZM19 12C18.45 12 18 11.55 18 11C18 10.45 18.45 10 19 10C19.55 10 20 10.45 20 11C20 11.55 19.55 12 19 12ZM18 3H6V7H18V3Z" fill="currentColor"/></svg>;
const SettingsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.5 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.5 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.73 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.04 4.95 18.95L7.44 17.94C7.96 18.34 8.52 18.68 9.13 18.93L9.5 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.5 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.94L19.05 18.95C19.27 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98ZM12 15.5C10.07 15.5 8.5 13.93 8.5 12C8.5 10.07 10.07 8.5 12 8.5C13.93 8.5 15.5 10.07 15.5 12C15.5 13.93 13.93 15.5 12 15.5Z" fill="currentColor"/></svg>;
const ImageIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.5L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/></svg>;
const LogoutIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/></svg>;
const EmailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="currentColor"/></svg>;
const ReportsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 9.2H8V19H5V9.2ZM10.6 5H13.4V19H10.6V5ZM16.2 13H19V19H16.2V13Z" fill="currentColor"/></svg>;
const DirectoryIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM6 4H11V12L8.5 10.5L6 12V4Z" fill="currentColor"/></svg>;
const ProjectsIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 15c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/><path d="M0 0h24v24H0z" fill="none"/></svg>;
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="currentColor"/></svg>;
const ShareIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L16.04 7.15C16.56 7.62 17.24 7.92 18 7.92C19.66 7.92 21 6.58 21 4.92C21 3.26 19.66 1.92 18 1.92C16.34 1.92 15 3.26 15 4.92C15 5.16 15.04 5.39 15.09 5.62L7.96 9.77C7.44 9.3 6.76 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.76 15 7.44 14.7 7.96 14.23L15.09 18.38C15.04 18.61 15 18.84 15 19.08C15 20.74 16.34 22.08 18 22.08C19.66 22.08 21 20.74 21 19.08C21 17.42 19.66 16.08 18 16.08Z" fill="currentColor"/></svg>;
const ShoppingListIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 9H13V6H11V9ZM11 13H13V11H11V13ZM11 17H13V15H11V17ZM7 20C7 20.55 7.45 21 8 21H16C16.55 21 17 20.55 17 20V7H8C7.45 7 7 7.45 7 8V20ZM16 4H12L11 3H7L6 4H2V6H18V4H16Z" fill="currentColor"/></svg>;
const DocumentIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/></svg>;
const CommentIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/></svg>;
const CalendarIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill="currentColor"/></svg>;
const AttachFileIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" fill="currentColor"/></svg>;
const ToolIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 13h-4v4h-2v-4h-4v-2h4V7h2v4h4v2M7 2v2H2v5h5V7h5v10H9v-5H4v5h5v5H2v-5H0v7h9v-5h4v5h9v-7h-5v-5h5V7h-5V2H7z" fill="currentColor"/></svg>;
const SaveTemplateIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15l-5-2.18L7 18V5h10v13z" fill="currentColor"/></svg>;


// --- DATA TYPES ---
interface User {
    email: string;
    password?: string; // Should be hashed in a real app
}

interface Client {
    name: string;
    phone: string;
}

interface UserProfile {
    companyName: string;
    contactName: string;
    phone: string;
    logo: string; // base64 data URL
}

interface Comment {
    id: string;
    author: 'Клиент' | 'Исполнитель';
    text: string;
    timestamp: string;
}

interface EstimateItem {
    id: string;
    name: string;
    type: 'Работа' | 'Материал';
    unit: string;
    quantity: number;
    price: number;
    comments?: Comment[];
}

interface Estimate {
    id: string;
    name: string;
    items: EstimateItem[];
    discount?: Discount;
    approvedOn?: string;
}

interface EstimateTemplate {
    id: string;
    name: string;
    items: Omit<EstimateItem, 'id' | 'quantity' | 'comments'>[];
}

interface DirectoryItem {
    id: string;
    name: string;
    type: 'Работа' | 'Материал';
    unit: string;
    price: number;
}

interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    receipt?: string; // base64 data URL
}

interface Payment {
    id: string;
    date: string;
    amount: number;
}

interface Discount {
    type: 'percent' | 'fixed';
    value: number;
}

interface PhotoReport {
    id: string;
    date: string;
    description: string;
    image: string; // base64 data URL
}

interface ProjectScheduleItem {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    completed?: boolean;
}

interface ProjectDocument {
    id: string;
    name: string;
    file: string; // base64 data URL
    fileName: string;
}

interface InventoryItem {
    id: string;
    name: string;
    location: string; // 'На базе' or projectId
}

interface ProjectNote {
    id: string;
    text: string;
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
    address: string;
    status: 'В работе' | 'Завершен';
    client: Client;
    estimates: Estimate[];
    expenses: Expense[];
    payments: Payment[];
    contractor?: UserProfile;
    photoReports?: PhotoReport[];
    notes?: ProjectNote[];
    schedule?: ProjectScheduleItem[];
    documents?: ProjectDocument[];
    createdAt: string; // ISO Date string
    completedAt?: string; // ISO Date string
}

// --- HOOK FOR LOCALSTORAGE ---
const useLocalStorage = <T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue: Dispatch<SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

// --- UTILITY FUNCTIONS ---
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
};

const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// --- SIMULATED API HELPERS ---
const _get = <T,>(key: string, defaultValue: T): T => {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
};

const _set = <T,>(key: string, value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const _delay = (ms = 500) => {
    return new Promise<void>(res => setTimeout(res, ms));
};

// --- SIMULATED API ---
const api: {
    login: (email: string, password: string) => Promise<User>;
    register: (email: string, password: string) => Promise<User>;
    getData: (userKey: string) => Promise<{ projects: Project[]; directory: DirectoryItem[]; profile: UserProfile; templates: EstimateTemplate[]; inventory: InventoryItem[]; inventoryNotes: ProjectNote[]; }>;
    saveData: <T,>(userKey: string, dataType: 'projects' | 'directory' | 'profile' | 'templates' | 'inventory' | 'inventory_notes', data: T) => Promise<void>;
} = {
    async login(email: string, password: string): Promise<User> {
        await _delay();
        const users = _get<User[]>('prorab_users', []);
        const user = users.find(u => u.email === email);
        if (user && user.password === password) {
            return { email: user.email };
        }
        throw new Error('Неверный email или пароль.');
    },

    async register(email: string, password: string): Promise<User> {
        await _delay(700);
        const users = _get<User[]>('prorab_users', []);
        if (users.some(u => u.email === email)) {
            throw new Error('Пользователь с таким email уже существует.');
        }
        const newUser: User = { email, password };
        _set('prorab_users', [...users, newUser]);
        return { email: newUser.email };
    },

    async getData(userKey: string): Promise<{ projects: Project[], directory: DirectoryItem[], profile: UserProfile, templates: EstimateTemplate[], inventory: InventoryItem[], inventoryNotes: ProjectNote[] }> {
        await _delay(800);
        let projects = _get<Project[]>(`prorab_projects_${userKey}`, []);
        let directory = _get<DirectoryItem[]>(`prorab_directory_${userKey}`, []);
        const profile = _get<UserProfile>(`prorab_profile_${userKey}`, { companyName: '', contactName: userKey, phone: '', logo: '' });
        const templates = _get<EstimateTemplate[]>(`prorab_templates_${userKey}`, []);
        const inventory = _get<InventoryItem[]>(`prorab_inventory_${userKey}`, []);
        const inventoryNotes = _get<ProjectNote[]>(`prorab_inventory_notes_${userKey}`, []);
        
        // --- Data Migration for Directory Items without IDs ---
        let directoryNeedsUpdate = false;
        directory = directory.map(item => {
            if (!item.id) {
                directoryNeedsUpdate = true;
                // @ts-ignore
                return { ...item, id: generateId() };
            }
            return item;
        });
        if (directoryNeedsUpdate) {
            _set(`prorab_directory_${userKey}`, directory);
        }

        // --- Data Migration for multiple estimates ---
        let projectsNeedUpdate = false;
        projects = projects.map(p => {
            let tempProject: any = { ...p };
            // @ts-ignore - check for old structure
            if (p.estimate) {
                projectsNeedUpdate = true;
                const newEstimate: Estimate = {
                    id: generateId(),
                    name: 'Основная смета',
                    // @ts-ignore
                    items: p.estimate,
                    // @ts-ignore
                    discount: p.discount,
                    // @ts-ignore
                    approvedOn: p.estimateApprovedOn
                };
                tempProject.estimates = [newEstimate];
                delete tempProject.estimate;
                delete tempProject.discount;
                delete tempProject.estimateApprovedOn;
            }

            // --- Data Migration for notes from string to array ---
            if (tempProject.notes && typeof tempProject.notes === 'string' && tempProject.notes.trim() !== '') {
                projectsNeedUpdate = true;
                const newNote: ProjectNote = {
                    id: generateId(),
                    text: tempProject.notes,
                    createdAt: new Date().toISOString()
                };
                tempProject.notes = [newNote];
            }
            
            // --- Data Migration to add createdAt date ---
            if (!tempProject.createdAt) {
                projectsNeedUpdate = true;
                tempProject.createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            return tempProject as Project;
        });


        if (projectsNeedUpdate) {
            _set(`prorab_projects_${userKey}`, projects);
        }

        // This is a workaround for sharing data to the public view
        const allProjects = Object.keys(localStorage)
            .filter(k => k.startsWith('prorab_projects_') && k !== 'prorab_projects_all')
            .flatMap(k => JSON.parse(localStorage.getItem(k) || '[]'));
        _set('prorab_projects_all', allProjects);
        
        // Sync comments from public store on load
        projects = projects.map(p => {
            const publicProject = allProjects.find((pubP:Project) => pubP.id === p.id);
            if (!publicProject) return p;

            const syncedEstimates = p.estimates.map(est => {
                const publicEstimate = publicProject.estimates.find((pubE:Estimate) => pubE.id === est.id);
                if (!publicEstimate) return est;
                
                const syncedItems = est.items.map(item => {
                    const publicItem = publicEstimate.items.find((pubI:EstimateItem) => pubI.id === item.id);
                    const clientComments = (publicItem?.comments || []).filter(c => c.author === 'Клиент');
                    const contractorComments = item.comments?.filter(c => c.author === 'Исполнитель') || [];
                    const combined = [...clientComments, ...contractorComments].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    const uniqueComments = Array.from(new Map(combined.map(c => [c.id, c])).values());
                    return { ...item, comments: uniqueComments.length > 0 ? uniqueComments : undefined };
                });
                return { ...est, items: syncedItems };
            });
            return { ...p, estimates: syncedEstimates };
        });

        return { projects, directory, profile, templates, inventory, inventoryNotes };
    },

    async saveData<T,>(userKey: string, dataType: 'projects' | 'directory' | 'profile' | 'templates' | 'inventory' | 'inventory_notes', data: T): Promise<void> {
        await _delay();
        const key = `prorab_${dataType}_${userKey}`;
        _set(key, data);
    
        // If projects are updated, we must also update the aggregated 'all_projects' key
        // to ensure share links work immediately with the latest data.
        if (dataType === 'projects') {
            const otherProjectKeys = Object.keys(localStorage)
                .filter(k => k.startsWith('prorab_projects_') && k !== key && k !== 'prorab_projects_all');
            
            let combinedProjects = [...(data as Project[])];
            for (const otherKey of otherProjectKeys) {
                combinedProjects = [...combinedProjects, ..._get<Project[]>(otherKey, [])];
            }
             // Deduplicate in case of any overlap
            const uniqueProjects = Array.from(new Map(combinedProjects.map(p => [p.id, p])).values());
            _set('prorab_projects_all', uniqueProjects);
        }
    }
};

// --- UI COMPONENTS ---

interface LoaderProps {
  fullScreen?: boolean;
}
const Loader = ({ fullScreen = false }: LoaderProps) => (
    <div className={fullScreen ? "loader-overlay" : ""}>
        <div className="loader-spinner"></div>
    </div>
);

type ToastMessage = { id: number; message: string; type: 'success' | 'error'; };
const ToastContext = createContext<{ addToast: (message: string, type: 'success' | 'error') => void; }>({ addToast: () => {} });

interface ToastProviderProps {
    children: React.ReactNode;
}
const ToastProvider = ({ children }: ToastProviderProps) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const useToasts = () => useContext(ToastContext);

interface ModalProps {
    show: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
const Modal = ({ show, onClose, title, children }: ModalProps) => {
    useEffect(() => {
        if (show) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [show]);

    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 id="modal-title">{title}</h3>
                    <button onClick={onClose} className="close-button" aria-label="Закрыть">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- CORE APP COMPONENTS ---

interface FinancialDashboardProps {
    project: Project;
}
const FinancialDashboard = ({ project }: FinancialDashboardProps) => {
    const totals = useMemo(() => {
        const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
            const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
            const discountAmount = estimate.discount
                ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value)
                : 0;
            return projectSum + (subtotal - discountAmount);
        }, 0);

        const workTotal = project.estimates.flatMap(e => e.items)
            .filter(item => item.type === 'Работа')
            .reduce((sum, item) => sum + item.quantity * item.price, 0);

        const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalPaid = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        // Profit is the money for work minus additional expenses.
        const profit = workTotal - expensesTotal;
        const clientDebt = estimateTotal - totalPaid;

        return { estimateTotal, workTotal, expensesTotal, totalPaid, profit, clientDebt };
    }, [project]);

    return (
        <div className="card-inset">
            <div className="financial-summary-grid">
                <div className="summary-item">
                    <div className="summary-item-label">Смета</div>
                    <div className="summary-item-value">{formatCurrency(totals.estimateTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Оплачено</div>
                    <div className="summary-item-value">{formatCurrency(totals.totalPaid)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Долг клиента</div>
                    <div className={`summary-item-value ${totals.clientDebt > 0 ? 'loss' : ''}`}>
                        {formatCurrency(totals.clientDebt)}
                    </div>
                </div>
                 <div className="summary-item">
                    <div className="summary-item-label">Стоимость работ</div>
                    <div className="summary-item-value">{formatCurrency(totals.workTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Расходы</div>
                    <div className="summary-item-value">{formatCurrency(totals.expensesTotal)}</div>
                </div>
                <div className="summary-item">
                    <div className="summary-item-label">Прибыль</div>
                    <div className={`summary-item-value ${totals.profit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(totals.profit)}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CommentModalProps {
    show: boolean;
    onClose: () => void;
    item: EstimateItem | null;
    onAddComment: (itemId: string, commentText: string) => void;
}
const CommentModal = ({ show, onClose, item, onAddComment }: CommentModalProps) => {
    const [newComment, setNewComment] = useState('');
    
    if (!item) return null;

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(item.id, newComment.trim());
            setNewComment('');
        }
    };

    return (
        <Modal show={show} onClose={onClose} title={`Комментарии: ${item.name}`}>
            <div className="comment-modal-body">
                <div className="comment-thread">
                    {(item.comments || []).length === 0 ? (
                        <p style={{textAlign: 'center', color: 'hsl(var(--text-secondary))'}}>Комментариев пока нет.</p>
                    ) : (
                        item.comments?.map(comment => (
                            <div key={comment.id} className={`comment-bubble author-${comment.author === 'Клиент' ? 'client' : 'contractor'}`}>
                                <p>{comment.text}</p>
                                <small>{new Date(comment.timestamp).toLocaleString('ru-RU')}</small>
                            </div>
                        ))
                    )}
                </div>
                <form className="comment-form" onSubmit={handleCommentSubmit}>
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Ваш комментарий..."
                        style={{flex: 1}}
                    />
                    <button type="submit" className="btn btn-primary">Отправить</button>
                </form>
            </div>
        </Modal>
    );
};


interface EstimateEditorProps {
    estimate: Estimate;
    projectId: string;
    onUpdate: (updatedEstimate: Estimate) => Promise<void>;
    onDelete: (estimateId: string) => Promise<void>;
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    userKey: string;
    onSaveTemplate: (template: EstimateTemplate) => Promise<void>;
}

type FormEstimateItem = {
    name: string;
    type: 'Работа' | 'Материал';
    unit: string;
    quantity: string | number;
    price: string | number;
}

const EstimateEditor = ({ estimate, projectId, onUpdate, onDelete, directory, setDirectory, userKey, onSaveTemplate }: EstimateEditorProps) => {
    const [showModal, setShowModal] = useState(false);
    const [showShoppingListModal, setShowShoppingListModal] = useState(false);
    const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
    const [newItem, setNewItem] = useState<FormEstimateItem>({ name: '', type: 'Работа', unit: 'шт', quantity: '1', price: '' });
    const [suggestions, setSuggestions] = useState<DirectoryItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(estimate.discount?.type || 'percent');
    const [discountValue, setDiscountValue] = useState<string | number>(estimate.discount?.value || '');
    const [estimateName, setEstimateName] = useState(estimate.name);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);

    useEffect(() => {
        setDiscountType(estimate.discount?.type || 'percent');
        setDiscountValue(estimate.discount?.value || '');
        setEstimateName(estimate.name);
    }, [estimate]);

    const isEditing = editingItem !== null;

    const parsedDiscountValue = parseFloat(String(discountValue)) || 0;

    const subtotal = useMemo(() => estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0), [estimate.items]);
    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return subtotal * (parsedDiscountValue / 100);
        }
        return parsedDiscountValue;
    }, [subtotal, discountType, parsedDiscountValue]);
    const total = subtotal - discountAmount;

    const shoppingList = useMemo(() => {
        return estimate.items
            .filter(item => item.type === 'Материал')
            .map(item => ({ name: item.name, quantity: item.quantity, unit: item.unit }));
    }, [estimate.items]);

    const handleCopyShoppingList = () => {
        if (shoppingList.length === 0) return;
        const listText = shoppingList
            .map(item => `${item.name} - ${item.quantity} ${item.unit}`)
            .join('\n');
        navigator.clipboard.writeText(listText).then(() => {
            addToast('Список покупок скопирован!', 'success');
            setShowShoppingListModal(false);
        }, (err) => {
            console.error('Could not copy text: ', err);
            addToast('Не удалось скопировать', 'error');
        });
    };

    const openModalForNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', type: 'Работа', unit: 'шт', quantity: '1', price: '' });
        setShowModal(true);
    };

    const openModalForEdit = (item: EstimateItem) => {
        setEditingItem(item);
        setNewItem({ ...item, quantity: String(item.quantity), price: String(item.price) });
        setShowModal(true);
    };

    const closeModal = () => {
        if(isSaving) return;
        setShowModal(false);
        setSuggestions([]);
        setEditingItem(null);
    };
    
    const handleSaveItem = async () => {
        const trimmedName = newItem.name.trim();
        if (!trimmedName) return;
        setIsSaving(true);

        const finalItemData = {
            name: trimmedName,
            type: newItem.type,
            unit: newItem.unit,
            quantity: parseFloat(String(newItem.quantity)) || 1,
            price: parseFloat(String(newItem.price)) || 0,
        };

        try {
            let updatedItems;
            if (isEditing && editingItem) { // Update existing item
                updatedItems = estimate.items.map(item => item.id === editingItem.id ? { ...item, ...finalItemData } : item);
            } else { // Add new item
                const itemWithId: EstimateItem = { ...finalItemData, id: generateId() };
                updatedItems = [...estimate.items, itemWithId];
            }
            await onUpdate({ ...estimate, items: updatedItems });
            
            const isInDirectory = directory.some(dirItem => dirItem.name.toLowerCase() === trimmedName.toLowerCase());
            if (!isInDirectory) {
                const newDirectoryItem: DirectoryItem = { 
                    id: generateId(), 
                    name: finalItemData.name, 
                    type: finalItemData.type, 
                    unit: finalItemData.unit, 
                    price: finalItemData.price 
                };
                const updatedDirectory = [...directory, newDirectoryItem];
                setDirectory(updatedDirectory);
                await api.saveData(userKey, 'directory', updatedDirectory);
            }
            addToast(isEditing ? 'Позиция обновлена' : 'Позиция добавлена', 'success');
            closeModal();
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту позицию?')) {
            try {
                const updatedItems = estimate.items.filter(item => item.id !== itemId);
                await onUpdate({ ...estimate, items: updatedItems });
                addToast('Позиция удалена', 'success');
            } catch (e) {
                addToast('Не удалось удалить', 'error');
            }
        }
    };

    const handleDiscountChange = async (type: 'percent' | 'fixed', value: string | number) => {
        try {
            const newDiscount: Discount = { type, value: parseFloat(String(value)) || 0 };
            await onUpdate({ ...estimate, discount: newDiscount });
            addToast('Скидка применена', 'success');
        } catch (e) {
            addToast('Не удалось применить скидку', 'error');
        }
    };

    const handleNameChangeOnBlur = async () => {
        if (estimateName.trim() && estimateName !== estimate.name) {
            try {
                await onUpdate({ ...estimate, name: estimateName.trim() });
                addToast('Название сметы обновлено', 'success');
            } catch (e) {
                 addToast('Не удалось обновить название', 'error');
            }
        }
    };

    const handleShare = () => {
        const estimateLink = `${window.location.origin}${window.location.pathname}?view=estimate&projectId=${projectId}&estimateId=${estimate.id}`;
        navigator.clipboard.writeText(estimateLink).then(() => {
            addToast('Ссылка на смету скопирована!', 'success');
        });
    };

    const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewItem({ ...newItem, name: value });
        if (value.trim().length > 1) {
            const filteredSuggestions = directory.filter(item =>
                item.name.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 5);
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    };

    const handleSuggestionClick = (suggestion: DirectoryItem) => {
        setNewItem({
            ...newItem,
            name: suggestion.name,
            type: suggestion.type,
            unit: suggestion.unit,
            price: String(suggestion.price),
        });
        setSuggestions([]);
    };

    const handleSaveAsTemplate = () => {
        if (!estimateName.trim()) {
            addToast('Сначала введите название сметы', 'error');
            return;
        }
        if (estimate.items.length === 0) {
            addToast('Нельзя сохранить пустую смету как шаблон', 'error');
            return;
        }

        const template: EstimateTemplate = {
            id: generateId(),
            name: estimateName.trim(),
            items: estimate.items.map(({ name, type, unit, price }) => ({ name, type, unit, price }))
        };

        onSaveTemplate(template);
    };

    const openCommentModal = (item: EstimateItem) => {
        setCommentingItem(item);
        setShowCommentModal(true);
    };

    const handleAddComment = (itemId: string, commentText: string) => {
        const newComment: Comment = {
            id: generateId(),
            author: 'Исполнитель',
            text: commentText,
            timestamp: new Date().toISOString()
        };

        const updatedItems = estimate.items.map(item => {
            if (item.id === itemId) {
                return { ...item, comments: [...(item.comments || []), newComment] };
            }
            return item;
        });

        onUpdate({ ...estimate, items: updatedItems });
    };
    
    return (
        <div className="card">
            <div className="estimate-card-header">
                <input 
                    type="text" 
                    value={estimateName} 
                    onChange={(e) => setEstimateName(e.target.value)}
                    onBlur={handleNameChangeOnBlur}
                    className="estimate-name-input"
                    aria-label="Название сметы"
                />
                <div className="card-header-actions">
                    <button className="btn btn-primary btn-sm" onClick={openModalForNew}>+ Добавить</button>
                    <button className="action-btn" onClick={handleSaveAsTemplate} aria-label="Сохранить как шаблон"><SaveTemplateIcon /></button>
                    <button className="action-btn" onClick={() => setShowShoppingListModal(true)} aria-label="Список покупок"><ShoppingListIcon /></button>
                    <button className="action-btn" onClick={handleShare} aria-label="Поделиться"><ShareIcon /></button>
                    <button className="action-btn" onClick={() => onDelete(estimate.id)} aria-label="Удалить смету"><DeleteIcon /></button>
                </div>
            </div>
             {estimate.approvedOn && (
                <span className="approval-badge">
                    <CheckIcon />
                    Согласована клиентом {new Date(estimate.approvedOn).toLocaleDateString('ru-RU')}
                </span>
            )}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Позиция</th>
                            <th className="align-right">Кол-во</th>
                            <th className="align-right">Цена</th>
                            <th className="align-right">Итог</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {estimate.items.length === 0 ? (
                            <tr><td colSpan={5} style={{textAlign: 'center', padding: '1rem'}}>Позиций пока нет.</td></tr>
                        ) : (
                            estimate.items.map((item, index) => (
                                <tr key={item.id} className="animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                    <td>
                                        <strong>{item.name}</strong>
                                        <br />
                                        <small>{item.type}</small>
                                    </td>
                                    <td className="align-right">{item.quantity} {item.unit}</td>
                                    <td className="align-right">{formatCurrency(item.price)}</td>
                                    <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                    <td className="align-right">
                                        <div className="item-actions">
                                            <button className="action-btn comment-btn" onClick={() => openCommentModal(item)} aria-label="Комментарии">
                                                <CommentIcon />
                                                {(item.comments?.length || 0) > 0 && <span className="comment-badge">{item.comments?.length}</span>}
                                            </button>
                                            <button className="action-btn" onClick={() => openModalForEdit(item)} aria-label="Редактировать"><EditIcon /></button>
                                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)} aria-label="Удалить"><DeleteIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="estimate-summary-container">
                <div className="discount-controls">
                    <label>Скидка</label>
                    <div className="d-flex">
                        <div className="modal-toggle">
                            <button className={discountType === 'percent' ? 'active' : ''} onClick={() => { setDiscountType('percent'); handleDiscountChange('percent', discountValue); }}>%</button>
                            <button className={discountType === 'fixed' ? 'active' : ''} onClick={() => { setDiscountType('fixed'); handleDiscountChange('fixed', discountValue); }}>₽</button>
                        </div>
                        <input 
                            type="number" 
                            className="discount-input"
                            value={discountValue} 
                            placeholder="0"
                            onChange={(e) => setDiscountValue(e.target.value)}
                            onBlur={() => handleDiscountChange(discountType, discountValue)}
                            step={discountType === 'percent' ? '0.1' : '100'}
                        />
                    </div>
                </div>

                <div className="estimate-totals">
                     <div className="total-row">
                         <span>Подытог</span>
                         <span>{formatCurrency(subtotal)}</span>
                     </div>
                     {discountAmount > 0 && (
                         <div className="total-row discount-row">
                             <span>Скидка ({discountType === 'percent' ? `${parsedDiscountValue}%` : formatCurrency(parsedDiscountValue)})</span>
                             <span>- {formatCurrency(discountAmount)}</span>
                         </div>
                     )}
                     <div className="total-row grand-total">
                         <span>Итого</span>
                         <span>{formatCurrency(total)}</span>
                     </div>
                 </div>
            </div>

             <Modal show={showModal} onClose={closeModal} title={isEditing ? 'Редактировать позицию' : 'Добавить позицию'}>
                <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSaveItem(); }}>
                    <div className="form-group autocomplete-container">
                        <label>Наименование</label>
                        <input type="text" value={newItem.name} onChange={handleNameInputChange} required autoComplete="off" disabled={isSaving}/>
                        {suggestions.length > 0 && (
                            <div className="autocomplete-suggestions">
                                {suggestions.map(suggestion => (
                                    <div key={suggestion.id} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                                        <div className="suggestion-name">{suggestion.name}</div>
                                        <div className="suggestion-details">
                                            {formatCurrency(suggestion.price)} ({suggestion.type})
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                     <div className="form-group">
                        <label>Тип</label>
                        <select value={newItem.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewItem({...newItem, type: e.target.value as 'Работа' | 'Материал'})} disabled={isSaving}>
                            <option>Работа</option>
                            <option>Материал</option>
                        </select>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                           <label>Количество</label>
                           <input type="number" step="any" value={newItem.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, quantity: e.target.value})} required disabled={isSaving}/>
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм.</label>
                           <input type="text" value={newItem.unit} placeholder="шт, м², час" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, unit: e.target.value})} required disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Цена за единицу</label>
                        <input type="number" step="0.01" value={newItem.price} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, price: e.target.value})} required disabled={isSaving}/>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? <Loader /> : (isEditing ? 'Сохранить' : 'Добавить')}
                        </button>
                    </div>
                </form>
            </Modal>
             <Modal show={showShoppingListModal} onClose={() => setShowShoppingListModal(false)} title="Список покупок">
                <div className="shopping-list-container">
                    {shoppingList.length > 0 ? (
                        <ul className="shopping-list">
                            {shoppingList.map((item, index) => (
                                <li key={index} className="shopping-list-item">
                                    <span className="shopping-list-name">{item.name}</span>
                                    <span className="shopping-list-quantity">{item.quantity} {item.unit}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>В смете нет материалов для составления списка.</p>
                    )}
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowShoppingListModal(false)}>Закрыть</button>
                    <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={handleCopyShoppingList}
                        disabled={shoppingList.length === 0}
                    >
                        Скопировать список
                    </button>
                </div>
            </Modal>
            <CommentModal
                show={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                item={commentingItem}
                onAddComment={handleAddComment}
            />
        </div>
    );
};

interface ExpenseTrackerProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ExpenseTracker = ({ project, projects, setProjects, userKey }: ExpenseTrackerProps) => {
    const [showModal, setShowModal] = useState(false);
    const [entryType, setEntryType] = useState<'expense' | 'payment'>('expense');
    const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: '' as string | number });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();

    const transactions = useMemo(() => {
        const combinedExpenses = project.expenses.map(e => ({ ...e, type: 'expense' as const }));
        const combinedPayments = project.payments.map(p => ({ ...p, type: 'payment' as const, description: 'Платеж от клиента' }));
        return [...combinedExpenses, ...combinedPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [project.expenses, project.payments]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const finalAmount = parseFloat(String(newEntry.amount)) || 0;
        if (finalAmount <= 0) {
            addToast('Сумма должна быть больше нуля', 'error');
            setIsSaving(false);
            return;
        }

        try {
            if (entryType === 'expense') {
                let receiptDataUrl: string | undefined = undefined;
                if (receiptFile) {
                    receiptDataUrl = await fileToBase64(receiptFile);
                }
                const expenseWithId: Expense = { ...newEntry, amount: finalAmount, id: generateId(), receipt: receiptDataUrl };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, expenses: [...p.expenses, expenseWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            } else {
                const paymentWithId: Payment = { id: generateId(), date: newEntry.date, amount: finalAmount };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, payments: [...p.payments, paymentWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            }
            addToast('Операция добавлена', 'success');
            setShowModal(false);
            setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: '' });
            setReceiptFile(null);
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteTransaction = async (id: string, type: 'expense' | 'payment') => {
        if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
        
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    if (type === 'expense') {
                        return { ...p, expenses: p.expenses.filter(e => e.id !== id) };
                    } else { // type === 'payment'
                        return { ...p, payments: p.payments.filter(pay => pay.id !== id) };
                    }
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Запись удалена', 'success');
        } catch (e) {
            addToast('Не удалось удалить', 'error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };
    
    const openReceiptPreview = (imageData: string) => {
        setReceiptPreview(imageData);
    };

    const closeReceiptPreview = () => {
        setReceiptPreview(null);
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Финансы</h3>
                 <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить</button>
            </div>

            {transactions.length === 0 ? (
                <div className="transaction-list-empty">Операций пока нет.</div>
            ) : (
                <div className="transaction-list">
                    {transactions.map((t, index) => (
                        <div key={t.id} className="transaction-item animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="transaction-details">
                                <span className="transaction-description">{t.description}</span>
                                <span className="transaction-date">{new Date(t.date).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="d-flex align-center">
                                {t.type === 'expense' && t.receipt && (
                                    <img src={t.receipt} alt="Чек" className="receipt-image" onClick={() => openReceiptPreview(t.receipt!)} />
                                )}
                                <span className={`transaction-amount ${t.type}`}>
                                    {t.type === 'expense' ? '-' : '+'}
                                    {formatCurrency(t.amount)}
                                </span>
                                 <button className="action-btn" onClick={() => handleDeleteTransaction(t.id, t.type)} aria-label="Удалить"><DeleteIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить операцию">
                 <div className="modal-toggle" style={{justifyContent: 'center', marginBottom: 'var(--space-6)'}}>
                    <button className={entryType === 'expense' ? 'active' : ''} onClick={() => setEntryType('expense')}>Расход</button>
                    <button className={entryType === 'payment' ? 'active' : ''} onClick={() => setEntryType('payment')}>Платеж</button>
                </div>
                <form onSubmit={handleAddEntry}>
                    <div className="form-group">
                        <label>Сумма</label>
                        <input type="number" step="0.01" value={newEntry.amount} placeholder="0" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, amount: e.target.value})} required disabled={isSaving}/>
                    </div>
                     <div className="form-group">
                        <label>Дата</label>
                        <input type="date" value={newEntry.date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, date: e.target.value})} required disabled={isSaving}/>
                    </div>
                    {entryType === 'expense' && (
                        <>
                            <div className="form-group">
                                <label>Описание</label>
                                <input type="text" value={newEntry.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, description: e.target.value})} placeholder="Например, материалы с рынка" required disabled={isSaving}/>
                            </div>
                            <div className="form-group">
                                <label>Фото чека</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} disabled={isSaving}/>
                            </div>
                        </>
                    )}
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal show={!!receiptPreview} onClose={closeReceiptPreview} title="Просмотр чека">
                {receiptPreview && <img src={receiptPreview} alt="Чек" style={{width: '100%', borderRadius: 'var(--border-radius)'}} />}
            </Modal>
        </div>
    );
};

interface PhotoViewerModalProps {
    show: boolean;
    onClose: () => void;
    images: PhotoReport[];
    startIndex: number;
}
const PhotoViewerModal = ({ show, onClose, images, startIndex }: PhotoViewerModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    useEffect(() => {
        if (show) {
            setCurrentIndex(startIndex);
        }
    }, [show, startIndex]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    }, [images.length]);

    useEffect(() => {
        if (!show) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext();
            else if (e.key === 'ArrowLeft') goToPrevious();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, goToNext, goToPrevious, onClose]);

    if (!show || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className="photo-viewer-overlay" onClick={onClose}>
            <button className="photo-viewer-close-btn" aria-label="Закрыть" onClick={onClose}>&times;</button>
            <button className="photo-viewer-nav-btn prev" aria-label="Предыдущее фото" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}>&#10094;</button>
            <div className="photo-viewer-content" onClick={(e) => e.stopPropagation()}>
                <img src={currentImage.image} alt={currentImage.description} />
                {currentImage.description && <p className="photo-viewer-description">{currentImage.description}</p>}
            </div>
            <button className="photo-viewer-nav-btn next" aria-label="Следующее фото" onClick={(e) => { e.stopPropagation(); goToNext(); }}>&#10095;</button>
        </div>
    );
};

interface PhotoReportsProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const PhotoReports = ({ project, projects, setProjects, userKey }: PhotoReportsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newReport, setNewReport] = useState({ date: new Date().toISOString().split('T')[0], description: '' });
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const photoReports = project.photoReports || [];

    const openViewer = (index: number) => {
        setCurrentImageIndex(index);
        setIsViewerOpen(true);
    };

    const closeViewer = () => {
        setIsViewerOpen(false);
    };

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportFile) {
            addToast('Пожалуйста, выберите файл', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const imageDataUrl = await fileToBase64(reportFile);
            const reportWithId: PhotoReport = {
                ...newReport,
                id: generateId(),
                image: imageDataUrl,
            };

            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const existingReports = p.photoReports || [];
                    return { ...p, photoReports: [reportWithId, ...existingReports] };
                }
                return p;
            });

            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Фотоотчет добавлен', 'success');
            setShowModal(false);
            setNewReport({ date: new Date().toISOString().split('T')[0], description: '' });
            setReportFile(null);
        } catch (err) {
            addToast('Не удалось добавить фотоотчет', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот фотоотчет?')) return;

        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const updatedReports = (p.photoReports || []).filter(r => r.id !== reportId);
                    return { ...p, photoReports: updatedReports };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Фотоотчет удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить фотоотчет', 'error');
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Фотоотчеты</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить фото</button>
            </div>
            {photoReports.length === 0 ? (
                <div className="transaction-list-empty">Фотоотчетов пока нет.</div>
            ) : (
                <div className="photo-reports-grid">
                    {photoReports.map((report, index) => (
                        <div key={report.id} className="photo-report-card" onClick={() => openViewer(index)}>
                            <img src={report.image} alt={report.description} />
                            <div className="photo-report-info">
                                <p>{report.description}</p>
                                <small>{new Date(report.date).toLocaleDateString('ru-RU')}</small>
                            </div>
                            <button className="photo-report-delete-btn action-btn" onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} aria-label="Удалить фотоотчет">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить фотоотчет">
                <form onSubmit={handleAddReport}>
                    <div className="form-group">
                        <label>Фотография</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Описание</label>
                        <input type="text" value={newReport.description} onChange={e => setNewReport({ ...newReport, description: e.target.value })} placeholder="Например, укладка плитки" required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Дата</label>
                        <input type="date" value={newReport.date} onChange={e => setNewReport({ ...newReport, date: e.target.value })} required disabled={isSaving} />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>
            <PhotoViewerModal
                show={isViewerOpen}
                onClose={closeViewer}
                images={photoReports}
                startIndex={currentImageIndex}
            />
        </div>
    );
};

interface ProjectScheduleProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectSchedule = ({ project, projects, setProjects, userKey }: ProjectScheduleProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', startDate: '', endDate: '' });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const schedule = project.schedule || [];

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name || !newItem.startDate || !newItem.endDate) {
            addToast('Заполните все поля', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const itemWithId: ProjectScheduleItem = { ...newItem, id: generateId(), completed: false };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const existingSchedule = p.schedule || [];
                    return { ...p, schedule: [...existingSchedule, itemWithId] };
                }
                return p;
            });

            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Этап добавлен в график', 'success');
            setShowModal(false);
            setNewItem({ name: '', startDate: '', endDate: '' });
        } catch (err) {
            addToast('Не удалось добавить этап', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить этот этап?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, schedule: (p.schedule || []).filter(item => item.id !== itemId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Этап удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить этап', 'error');
        }
    };

    const toggleItemCompletion = async (itemId: string) => {
         try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    const updatedSchedule = (p.schedule || []).map(item =>
                        item.id === itemId ? { ...item, completed: !item.completed } : item
                    );
                    return { ...p, schedule: updatedSchedule };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
        } catch (err) {
            addToast('Не удалось обновить статус', 'error');
        }
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>График работ</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Добавить этап</button>
            </div>
            {schedule.length === 0 ? (
                <div className="transaction-list-empty">Этапы работ пока не добавлены.</div>
            ) : (
                <div className="data-list">
                    {schedule.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(item => (
                        <div key={item.id} className={`data-item schedule-item ${item.completed ? 'completed' : ''}`}>
                             <div className="schedule-item-toggle">
                                <button className="action-btn" onClick={() => toggleItemCompletion(item.id)}>
                                    {item.completed ? <ReplayIcon /> : <CheckIcon />}
                                </button>
                            </div>
                            <div className="data-item-info">
                                <p><strong>{item.name}</strong></p>
                                <span className="data-item-subtext">
                                    {new Date(item.startDate).toLocaleDateString('ru-RU')} - {new Date(item.endDate).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)} aria-label="Удалить этап">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
             <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Добавить этап работ">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Наименование этапа</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Например, Черновые работы" required disabled={isSaving} />
                    </div>
                     <div className="d-flex gap-1">
                        <div className="form-group w-100">
                            <label>Дата начала</label>
                            <input type="date" value={newItem.startDate} onChange={e => setNewItem({ ...newItem, startDate: e.target.value })} required disabled={isSaving} />
                        </div>
                        <div className="form-group w-100">
                            <label>Дата окончания</label>
                            <input type="date" value={newItem.endDate} onChange={e => setNewItem({ ...newItem, endDate: e.target.value })} required disabled={isSaving} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Добавить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


interface ProjectDocumentsProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectDocuments = ({ project, projects, setProjects, userKey }: ProjectDocumentsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '' });
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const documents = project.documents || [];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocumentFile(e.target.files[0]);
            if (!newItem.name) {
                setNewItem({ name: e.target.files[0].name.replace(/\.[^/.]+$/, "") });
            }
        }
    };
    
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!documentFile) {
            addToast('Выберите файл для загрузки', 'error');
            return;
        }
        setIsSaving(true);
        try {
            const fileData = await fileToBase64(documentFile);
            const itemWithId: ProjectDocument = {
                id: generateId(),
                name: newItem.name.trim(),
                file: fileData,
                fileName: documentFile.name
            };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, documents: [...(p.documents || []), itemWithId] };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Документ загружен', 'success');
            setShowModal(false);
            setNewItem({ name: '' });
            setDocumentFile(null);
        } catch (err) {
            addToast('Не удалось загрузить документ', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить этот документ?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, documents: (p.documents || []).filter(item => item.id !== itemId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Документ удален', 'success');
        } catch (err) {
            addToast('Не удалось удалить документ', 'error');
        }
    };
    
    const handleDownload = (fileDataUrl: string, fileName: string) => {
        const link = document.createElement('a');
        link.href = fileDataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>Документы</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Загрузить</button>
            </div>
            {documents.length === 0 ? (
                <div className="transaction-list-empty">Документов пока нет.</div>
            ) : (
                <div className="data-list">
                    {documents.map(doc => (
                        <div key={doc.id} className="data-item">
                            <div className="data-item-info">
                                <a href="#" onClick={(e) => { e.preventDefault(); handleDownload(doc.file, doc.fileName); }}>
                                    {doc.name}
                                </a>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteItem(doc.id)} aria-label="Удалить документ">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
             <Modal show={showModal} onClose={() => !isSaving && setShowModal(false)} title="Загрузить документ">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Файл</label>
                        <input type="file" onChange={handleFileChange} required disabled={isSaving} />
                    </div>
                    <div className="form-group">
                        <label>Название документа</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Например, Договор" required disabled={isSaving} />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isSaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                           {isSaving ? <Loader /> : 'Загрузить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

interface ProjectNotesProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectNotes = ({ project, projects, setProjects, userKey }: ProjectNotesProps) => {
    const [newNote, setNewNote] = useState('');
    const { addToast } = useToasts();
    
    const notes = project.notes || [];

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        try {
            const noteWithId: ProjectNote = {
                id: generateId(),
                text: newNote.trim(),
                createdAt: new Date().toISOString()
            };
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, notes: [...(p.notes || []), noteWithId] };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            setNewNote('');
        } catch (err) {
            addToast('Не удалось добавить заметку', 'error');
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Удалить эту заметку?')) return;
        try {
            const updatedProjects = projects.map(p => {
                if (p.id === project.id) {
                    return { ...p, notes: (p.notes || []).filter(note => note.id !== noteId) };
                }
                return p;
            });
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Заметка удалена', 'success');
        } catch (err) {
            addToast('Не удалось удалить заметку', 'error');
        }
    };

    return (
        <div className="card">
            <h3>Заметки по объекту</h3>
            {notes.length === 0 ? (
                <div className="transaction-list-empty">Заметок пока нет.</div>
            ) : (
                <div className="data-list">
                    {notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                        <div key={note.id} className="data-item">
                            <div className="data-item-info">
                                <p>{note.text}</p>
                                <span className="data-item-subtext">{new Date(note.createdAt).toLocaleString('ru-RU')}</span>
                            </div>
                            <button className="action-btn" onClick={() => handleDeleteNote(note.id)} aria-label="Удалить заметку">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleAddNote} className="add-note-form">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Новая заметка..."
                />
                <button type="submit" className="btn btn-primary btn-sm">Добавить</button>
            </form>
        </div>
    );
};

// --- VIEWS ---

interface ProjectDetailsViewProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    onBack: () => void;
    userKey: string;
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    onSaveTemplate: (template: EstimateTemplate) => Promise<void>;
}
const ProjectDetailsView = ({ project, projects, setProjects, onBack, userKey, directory, setDirectory, onSaveTemplate }: ProjectDetailsViewProps) => {
    const { addToast } = useToasts();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showActModal, setShowActModal] = useState(false);
    const [actContent, setActContent] = useState('');
    const [isActGenerating, setIsActGenerating] = useState(false);

    const handleUpdateProject = async (updatedProject: Project) => {
        try {
            const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
        } catch (e) {
            addToast('Ошибка при сохранении проекта', 'error');
        }
    };
    
    const handleDeleteProject = async () => {
        if (window.confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
            try {
                const updatedProjects = projects.filter(p => p.id !== project.id);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
                addToast('Проект удален', 'success');
                onBack();
            } catch (e) {
                addToast('Ошибка при удалении проекта', 'error');
            }
        }
    };

    const handleUpdateEstimate = async (updatedEstimate: Estimate) => {
        const updatedEstimates = project.estimates.map(e => e.id === updatedEstimate.id ? updatedEstimate : e);
        await handleUpdateProject({ ...project, estimates: updatedEstimates });
    };
    
    const handleAddEstimate = async () => {
        const newEstimate: Estimate = {
            id: generateId(),
            name: `Новая смета №${project.estimates.length + 1}`,
            items: [],
        };
        await handleUpdateProject({ ...project, estimates: [...project.estimates, newEstimate] });
        addToast('Новая смета добавлена', 'success');
    };

    const handleDeleteEstimate = async (estimateId: string) => {
        if (project.estimates.length <= 1) {
            addToast('Нельзя удалить последнюю смету', 'error');
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить эту смету?')) {
            const updatedEstimates = project.estimates.filter(e => e.id !== estimateId);
            await handleUpdateProject({ ...project, estimates: updatedEstimates });
            addToast('Смета удалена', 'success');
        }
    };

    const generateAct = async () => {
        if (!process.env.API_KEY) {
            setActContent("Ошибка: API_KEY не настроен. Пожалуйста, установите его в переменных окружения.");
            setShowActModal(true);
            return;
        }
        setIsActGenerating(true);
        setShowActModal(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const totalAmount = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);

            const prompt = `
                Сгенерируй формальный "Акт сдачи-приемки выполненных работ" в текстовом формате (не JSON).
                Используй следующие данные:
                - Исполнитель: ${project.contractor?.companyName || project.contractor?.contactName || 'Исполнитель'}
                - Заказчик: ${project.client.name}
                - Объект: "${project.name}" по адресу ${project.address}
                - Общая сумма работ по смете: ${formatCurrency(totalAmount)}
                - Дата завершения работ: ${new Date(project.completedAt!).toLocaleDateString('ru-RU')}

                Текст должен быть строгим, официальным и содержать стандартные формулировки о том, что работы выполнены в полном объеме, в надлежащем качестве и в установленные сроки, а заказчик не имеет претензий.
                В конце акта оставь поля для подписей "_________________ (Исполнитель)" и "_________________ (Заказчик)".
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            setActContent(response.text);

        } catch (error) {
            console.error(error);
            setActContent("Произошла ошибка при генерации акта. Проверьте консоль для получения дополнительной информации.");
        } finally {
            setIsActGenerating(false);
        }
    };
    
    return (
        <>
            <button className="back-button" onClick={onBack}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                Все проекты
            </button>
            <div className="project-details-header">
                <div className="d-flex justify-between align-start">
                    <div>
                        <h2>{project.name}</h2>
                        <p>{project.address}</p>
                        <p><strong>Клиент:</strong> {project.client.name}, {project.client.phone}</p>
                    </div>
                    <div className="project-header-actions">
                        {project.status === 'Завершен' && (
                            <button className="action-btn" onClick={generateAct} aria-label="Сгенерировать акт"><DocumentIcon /></button>
                        )}
                        <button className="action-btn" onClick={() => setShowEditModal(true)} aria-label="Редактировать проект"><EditIcon /></button>
                        <button className="action-btn" onClick={handleDeleteProject} aria-label="Удалить проект"><DeleteIcon /></button>
                    </div>
                </div>
            </div>

            <FinancialDashboard project={project} />

            <div className="estimates-container">
                {project.estimates.map(estimate => (
                     <EstimateEditor 
                        key={estimate.id}
                        estimate={estimate} 
                        projectId={project.id}
                        onUpdate={handleUpdateEstimate} 
                        onDelete={handleDeleteEstimate}
                        directory={directory}
                        setDirectory={setDirectory}
                        userKey={userKey}
                        onSaveTemplate={onSaveTemplate}
                    />
                ))}
            </div>
             <div style={{textAlign: 'center', marginTop: 'var(--space-6)'}}>
                 <button className="btn btn-secondary" onClick={handleAddEstimate}>+ Добавить смету</button>
             </div>

            <ExpenseTracker project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <PhotoReports project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectSchedule project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectDocuments project={project} projects={projects} setProjects={setProjects} userKey={userKey} />
            <ProjectNotes project={project} projects={projects} setProjects={setProjects} userKey={userKey} />

            <ProjectFormModal 
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleUpdateProject}
                existingProject={project}
            />
            <Modal show={showActModal} onClose={() => setShowActModal(false)} title="Акт сдачи-приемки работ">
                {isActGenerating ? <Loader /> : (
                    <>
                        <textarea className="act-textarea" value={actContent} readOnly />
                        <div className="form-actions">
                             <button className="btn btn-secondary" onClick={() => setShowActModal(false)}>Закрыть</button>
                             <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(actContent).then(() => addToast('Акт скопирован', 'success'))}>Скопировать</button>
                        </div>
                    </>
                )}
            </Modal>
        </>
    );
};

interface ProjectFormModalProps {
    show: boolean;
    onClose: () => void;
    onSave: (project: Project) => Promise<void>;
    existingProject?: Project;
}
const ProjectFormModal = ({ show, onClose, onSave, existingProject }: ProjectFormModalProps) => {
    const [projectData, setProjectData] = useState({
        name: '', address: '', status: 'В работе' as 'В работе' | 'Завершен',
        clientName: '', clientPhone: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    useEffect(() => {
        if (show && existingProject) {
            setProjectData({
                name: existingProject.name,
                address: existingProject.address,
                status: existingProject.status,
                clientName: existingProject.client.name,
                clientPhone: existingProject.client.phone
            });
        } else if (show) {
            setProjectData({ name: '', address: '', status: 'В работе', clientName: '', clientPhone: '' });
        }
    }, [show, existingProject]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const projectToSave: Project = {
                ...(existingProject || {
                    id: generateId(), estimates: [{ id: generateId(), name: 'Основная смета', items: [] }],
                    expenses: [], payments: [], createdAt: new Date().toISOString()
                }),
                name: projectData.name,
                address: projectData.address,
                status: projectData.status,
                client: { name: projectData.clientName, phone: projectData.clientPhone },
                completedAt: projectData.status === 'Завершен' && !existingProject?.completedAt ? new Date().toISOString() : existingProject?.completedAt,
            };
            await onSave(projectToSave);
            addToast(existingProject ? 'Проект обновлен' : 'Проект создан', 'success');
            onClose();
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProjectData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Modal show={show} onClose={() => !isSaving && onClose()} title={existingProject ? 'Редактировать проект' : 'Новый проект'}>
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label>Название объекта</label>
                    <input type="text" name="name" value={projectData.name} onChange={handleChange} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" name="address" value={projectData.address} onChange={handleChange} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" name="clientName" value={projectData.clientName} onChange={handleChange} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" name="clientPhone" value={projectData.clientPhone} onChange={handleChange} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select name="status" value={projectData.status} onChange={handleChange} required disabled={isSaving}>
                        <option>В работе</option>
                        <option>Завершен</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader /> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ReportsViewProps {
    projects: Project[];
}
const ReportsView = ({ projects }: ReportsViewProps) => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(lastDayOfMonth);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const completedDate = p.completedAt;
            return p.status === 'Завершен' && completedDate && completedDate >= startDate && completedDate <= endDate + 'T23:59:59';
        });
    }, [projects, startDate, endDate]);

    const reportData = useMemo(() => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalProfit = 0;

        filteredProjects.forEach(project => {
            const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);
            
            const workTotal = project.estimates.flatMap(e => e.items)
                .filter(item => item.type === 'Работа')
                .reduce((sum, item) => sum + item.quantity * item.price, 0);
            
            const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);

            totalRevenue += estimateTotal;
            totalExpenses += expensesTotal;
            totalProfit += (workTotal - expensesTotal);
        });

        return {
            totalRevenue,
            totalExpenses,
            totalProfit,
            completedProjectsCount: filteredProjects.length,
            averageProfit: filteredProjects.length > 0 ? totalProfit / filteredProjects.length : 0,
        };
    }, [filteredProjects]);

    const handleExportCSV = () => {
        if (filteredProjects.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel
        csvContent += "Проект,Клиент,Дата завершения,Сумма сметы,Расходы,Прибыль\n";

        filteredProjects.forEach(p => {
            const estimateTotal = p.estimates.reduce((sum, est) => sum + est.items.reduce((s, i) => s + i.price * i.quantity, 0), 0);
            const expensesTotal = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const workTotal = p.estimates.flatMap(e => e.items).filter(i => i.type === 'Работа').reduce((sum, i) => sum + i.price * i.quantity, 0);
            const profit = workTotal - expensesTotal;
            
            const row = [
                `"${p.name.replace(/"/g, '""')}"`,
                `"${p.client.name.replace(/"/g, '""')}"`,
                new Date(p.completedAt!).toLocaleDateString('ru-RU'),
                estimateTotal,
                expensesTotal,
                profit
            ].join(',');
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `report_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div className="reports-header">
                <h3>Сводный отчет</h3>
                <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={filteredProjects.length === 0}>
                    Скачать отчет (CSV)
                </button>
            </div>
            
            <div className="card date-filter-container">
                 <div className="d-flex gap-1 align-center">
                    <div className="form-group w-100">
                        <label>Начало периода</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                     <span>&mdash;</span>
                    <div className="form-group w-100">
                        <label>Конец периода</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                 </div>
            </div>

            <div className="reports-grid">
                <div className="report-card">
                    <div className="report-card-label">Общая выручка</div>
                    <div className="report-card-value">{formatCurrency(reportData.totalRevenue)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Общие расходы</div>
                    <div className="report-card-value">{formatCurrency(reportData.totalExpenses)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Чистая прибыль</div>
                    <div className={`report-card-value ${reportData.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(reportData.totalProfit)}
                    </div>
                </div>
            </div>

            <div className="reports-grid small" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
                 <div className="report-card small">
                    <div className="report-card-label">Завершено проектов</div>
                    <div className="report-card-value">{reportData.completedProjectsCount}</div>
                </div>
                 <div className="report-card small">
                    <div className="report-card-label">Средняя прибыль</div>
                    <div className="report-card-value">{formatCurrency(reportData.averageProfit)}</div>
                </div>
            </div>
            
             <div className="card">
                <h3>Детализация по проектам</h3>
                <div className="table-container">
                    <table className="profit-table">
                        <thead>
                            <tr>
                                <th>Проект</th>
                                <th className="align-right">Сумма</th>
                                <th className="align-right">Прибыль</th>
                            </tr>
                        </thead>
                        <tbody>
                             {filteredProjects.length === 0 ? (
                                <tr><td colSpan={3} style={{textAlign: 'center', padding: '1rem'}}>Нет завершенных проектов за выбранный период.</td></tr>
                            ) : (
                                filteredProjects.map(p => {
                                    const estimateTotal = p.estimates.reduce((sum, est) => {
                                        const subtotal = est.items.reduce((s, i) => s + i.price * i.quantity, 0);
                                        const discount = est.discount ? (est.discount.type === 'percent' ? subtotal * (est.discount.value / 100) : est.discount.value) : 0;
                                        return sum + (subtotal - discount);
                                    }, 0);
                                    const expensesTotal = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                                    const workTotal = p.estimates.flatMap(e => e.items).filter(i => i.type === 'Работа').reduce((sum, i) => sum + i.price * i.quantity, 0);
                                    const profit = workTotal - expensesTotal;

                                    return (
                                        <tr key={p.id}>
                                            <td>
                                                <strong>{p.name}</strong><br/>
                                                <small>{p.client.name}</small>
                                            </td>
                                            <td className="align-right">{formatCurrency(estimateTotal)}</td>
                                            <td className={`align-right ${profit >= 0 ? 'profit' : 'loss'}`}>{formatCurrency(profit)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </>
    );
};

// --- MAIN APP ---
type ViewState = 
    | { view: 'projects' } 
    | { view: 'project_details'; projectId: string; }
    | { view: 'reports' }
    | { view: 'directory' }
    | { view: 'settings' }
    | { view: 'inventory' };

const App = () => {
    const [user, setUser] = useLocalStorage<User | null>('prorab_user', null);
    const userKey = useMemo(() => user?.email || 'guest', [user]);

    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [directory, setDirectory] = useState<DirectoryItem[]>([]);
    const [profile, setProfile] = useState<UserProfile>({ companyName: '', contactName: '', phone: '', logo: '' });
    const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryNotes, setInventoryNotes] = useState<ProjectNote[]>([]);

    const [currentView, setCurrentView] = useState<ViewState>({ view: 'projects' });
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showDirectoryModal, setShowDirectoryModal] = useState(false);
    const [editingDirectoryItem, setEditingDirectoryItem] = useState<DirectoryItem | null>(null);
    const [newDirectoryItemData, setNewDirectoryItemData] = useState<Omit<DirectoryItem, 'id'>>({ name: '', type: 'Работа', unit: 'шт', price: 0 });
    const [isDirectorySaving, setIsDirectorySaving] = useState(false);
    const [directorySearchTerm, setDirectorySearchTerm] = useState('');

    const { addToast } = useToasts();
    
    useEffect(() => {
        const loadInitialData = async () => {
            if (userKey !== 'guest') {
                try {
                    const data = await api.getData(userKey);
                    setProjects(data.projects);
                    setDirectory(data.directory);
                    setProfile(data.profile);
                    setTemplates(data.templates);
                    setInventory(data.inventory);
                    setInventoryNotes(data.inventoryNotes);
                } catch (error) {
                    addToast('Не удалось загрузить данные', 'error');
                }
            }
            setLoading(false);
        };
        loadInitialData();
    }, [userKey, addToast]);
    
    const handleSaveProject = async (project: Project) => {
        const updatedProjects = projects.find(p => p.id === project.id)
            ? projects.map(p => p.id === project.id ? project : p)
            : [project, ...projects];
        
        setProjects(updatedProjects);
        await api.saveData(userKey, 'projects', updatedProjects);
    };

    const handleSaveProfile = async (updatedProfile: UserProfile) => {
        setProfile(updatedProfile);
        await api.saveData(userKey, 'profile', updatedProfile);
    };
    
    const handleSaveTemplate = async (template: EstimateTemplate) => {
        try {
            const updatedTemplates = [...templates, template];
            setTemplates(updatedTemplates);
            await api.saveData(userKey, 'templates', updatedTemplates);
            addToast('Шаблон сохранен!', 'success');
        } catch (e) {
            addToast('Не удалось сохранить шаблон', 'error');
        }
    };
    
    const openDirectoryEditModal = (item: DirectoryItem) => {
        setEditingDirectoryItem(item);
        setNewDirectoryItemData(item);
        setShowDirectoryModal(true);
    };

    const handleDeleteDirectoryItem = async (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту позицию из справочника?')) {
            try {
                const updatedDirectory = directory.filter(item => item.id !== itemId);
                setDirectory(updatedDirectory);
                await api.saveData(userKey, 'directory', updatedDirectory);
                addToast('Позиция удалена из справочника', 'success');
            } catch (e) {
                addToast('Не удалось удалить позицию', 'error');
            }
        }
    };

    const handleSaveDirectoryItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDirectorySaving(true);
        const trimmedName = newDirectoryItemData.name.trim();
        if (!trimmedName) {
            addToast('Название не может быть пустым', 'error');
            setIsDirectorySaving(false);
            return;
        }

        try {
            let updatedDirectory;
            if (editingDirectoryItem) {
                updatedDirectory = directory.map(item => item.id === editingDirectoryItem.id ? { ...item, ...newDirectoryItemData, name: trimmedName } : item);
            } else {
                // This case is not used as we don't have a dedicated "add to directory" button
                // It's populated from estimates, but this logic is here for completeness.
                const newItem: DirectoryItem = { ...newDirectoryItemData, name: trimmedName, id: generateId() };
                updatedDirectory = [...directory, newItem];
            }
            setDirectory(updatedDirectory);
            await api.saveData(userKey, 'directory', updatedDirectory);
            addToast('Справочник обновлен', 'success');
            setShowDirectoryModal(false);
        } catch (e) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsDirectorySaving(false);
        }
    };
    
    if (loading) {
        return <Loader fullScreen />;
    }

    if (!user) {
        return <AuthScreen onLogin={setUser} />;
    }
    
    if (currentView.view === 'project_details') {
        const project = projects.find(p => p.id === currentView.projectId);
        if (!project) {
            // Fallback if project not found
            setCurrentView({ view: 'projects' });
            return null;
        }
        return (
             <main className="app-container">
                <ProjectDetailsView 
                    project={project}
                    projects={projects}
                    setProjects={setProjects}
                    onBack={() => setCurrentView({ view: 'projects' })}
                    userKey={userKey}
                    directory={directory}
                    setDirectory={setDirectory}
                    onSaveTemplate={handleSaveTemplate}
                />
            </main>
        );
    }
    
    const renderContent = () => {
        if (currentView.view === 'projects') {
            return <ProjectListView projects={projects} setProjects={setProjects} onSelectProject={(id) => setCurrentView({ view: 'project_details', projectId: id })} onShowNewProjectModal={() => setShowProjectModal(true)} />;
        }
        if (currentView.view === 'reports') {
            return <ReportsView projects={projects} />;
        }
        if (currentView.view === 'directory') {
             const filteredDirectory = useMemo(() => {
                const sortedDirectory = [...directory].sort((a, b) => a.name.localeCompare(b.name));
                if (!directorySearchTerm.trim()) {
                    return sortedDirectory;
                }
                return sortedDirectory.filter(item =>
                    item.name.toLowerCase().includes(directorySearchTerm.toLowerCase())
                );
            }, [directory, directorySearchTerm]);

            return (
                 <div className="card">
                    <h3>Справочник</h3>
                    <p className="field-hint">Здесь хранятся все работы и материалы, которые вы добавляли в сметы. Вы можете управлять ими централизованно.</p>
                    
                    <div className="search-container">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Поиск по названию..."
                            className="search-input"
                            value={directorySearchTerm}
                            onChange={e => setDirectorySearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Наименование</th>
                                    <th>Тип</th>
                                    <th className="align-right">Цена</th>
                                    <th className="align-right">Ед. изм.</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDirectory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                                            {directorySearchTerm ? 'Ничего не найдено' : 'Справочник пока пуст.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDirectory.map((item, index) => (
                                        <tr key={item.id} className="animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            <td><strong>{item.name}</strong></td>
                                            <td>{item.type}</td>
                                            <td className="align-right">{formatCurrency(item.price)}</td>
                                            <td className="align-right">{item.unit}</td>
                                            <td className="align-right">
                                                <div className="item-actions">
                                                    <button className="action-btn" onClick={() => openDirectoryEditModal(item)} aria-label="Редактировать"><EditIcon /></button>
                                                    <button className="action-btn" onClick={() => handleDeleteDirectoryItem(item.id)} aria-label="Удалить"><DeleteIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
        if (currentView.view === 'inventory') {
            return <InventoryView inventory={inventory} setInventory={setInventory} notes={inventoryNotes} setNotes={setInventoryNotes} projects={projects} userKey={userKey} />;
        }
        if (currentView.view === 'settings') {
            return <SettingsView profile={profile} onSave={handleSaveProfile} onLogout={() => setUser(null)} />;
        }
        return null;
    };


    return (
        <>
            <Header user={user} onNavigate={setCurrentView} onLogout={() => setUser(null)} />
            <main className="app-container">
                {renderContent()}
            </main>
            <BottomNav currentView={currentView.view} onNavigate={setCurrentView} />
            <ProjectFormModal 
                show={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                onSave={handleSaveProject}
            />
            <Modal show={showDirectoryModal} onClose={() => setShowDirectoryModal(false)} title="Редактировать справочник">
                <form onSubmit={handleSaveDirectoryItem}>
                    <div className="form-group">
                        <label>Наименование</label>
                        <input type="text" value={newDirectoryItemData.name} onChange={e => setNewDirectoryItemData(p => ({...p, name: e.target.value}))} required disabled={isDirectorySaving} />
                    </div>
                     <div className="form-group">
                        <label>Тип</label>
                        <select value={newDirectoryItemData.type} onChange={e => setNewDirectoryItemData(p => ({...p, type: e.target.value as 'Работа' | 'Материал'}))} disabled={isDirectorySaving}>
                            <option>Работа</option>
                            <option>Материал</option>
                        </select>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                           <label>Цена</label>
                           <input type="number" step="0.01" value={newDirectoryItemData.price} onChange={e => setNewDirectoryItemData(p => ({...p, price: parseFloat(e.target.value) || 0}))} required disabled={isDirectorySaving}/>
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм.</label>
                           <input type="text" value={newDirectoryItemData.unit} onChange={e => setNewDirectoryItemData(p => ({...p, unit: e.target.value}))} required disabled={isDirectorySaving}/>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowDirectoryModal(false)} disabled={isDirectorySaving}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isDirectorySaving}>
                            {isDirectorySaving ? <Loader /> : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

// --- AUTH SCREEN ---
const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = isLogin ? await api.login(email, password) : await api.register(email, password);
            onLogin(user);
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <LogoIcon size={48} />
                    <h1>{isLogin ? 'Вход в Прораб' : 'Регистрация'}</h1>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className="auth-error">{error}</div>}
                    <div className="form-group form-group-icon">
                        <EmailIcon />
                        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group form-group-icon">
                        <LockIcon />
                        <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary btn-large w-100" disabled={loading}>
                        {loading ? <Loader /> : (isLogin ? 'Войти' : 'Создать аккаунт')}
                    </button>
                    <div style={{textAlign: 'center', marginTop: 'var(--space-6)'}}>
                        <button type="button" className="link-button" onClick={() => setIsLogin(!isLogin)}>
                            {isLogin ? 'У меня еще нет аккаунта' : 'Уже есть аккаунт? Войти'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- PUBLIC ESTIMATE VIEW ---
const PublicEstimateView = () => {
    const [project, setProject] = useState<Project | null>(null);
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { addToast } = useToasts();
    
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const projectId = params.get('projectId');
        const estimateId = params.get('estimateId');

        if (!projectId || !estimateId) {
            setError('Неверная ссылка на смету.');
            setLoading(false);
            return;
        }

        const allProjects = _get<Project[]>('prorab_projects_all', []);
        const foundProject = allProjects.find(p => p.id === projectId);
        const foundEstimate = foundProject?.estimates.find(e => e.id === estimateId);

        if (foundProject && foundEstimate) {
            setProject(foundProject);
            setEstimate(foundEstimate);
        } else {
            setError('Смета не найдена. Возможно, она была удалена.');
        }
        setLoading(false);
    }, []);

    const handleApprove = () => {
        if (!project || !estimate || estimate.approvedOn) return;
        if (window.confirm('Вы уверены, что хотите согласовать эту смету? Это действие нельзя будет отменить.')) {
            const allProjects = _get<Project[]>('prorab_projects_all', []);
            const updatedProjects = allProjects.map(p => {
                if (p.id === project.id) {
                    const updatedEstimates = p.estimates.map(e => e.id === estimate.id ? {...e, approvedOn: new Date().toISOString()} : e);
                    return {...p, estimates: updatedEstimates};
                }
                return p;
            });
            _set('prorab_projects_all', updatedProjects);
            
            // Also update the specific user's project data
            const userKey = project.contractor?.contactName; // This is a bit of a hack
            if (userKey) {
                const userProjects = _get<Project[]>(`prorab_projects_${userKey}`, []);
                const updatedUserProjects = userProjects.map(p => {
                    if (p.id === project.id) {
                        const updatedEstimates = p.estimates.map(e => e.id === estimate.id ? {...e, approvedOn: new Date().toISOString()} : e);
                        return {...p, estimates: updatedEstimates};
                    }
                    return p;
                });
                _set(`prorab_projects_${userKey}`, updatedUserProjects);
            }

            setEstimate(prev => prev ? {...prev, approvedOn: new Date().toISOString()} : null);
            addToast('Смета успешно согласована!', 'success');
        }
    };

    const handleAddComment = (itemId: string, commentText: string) => {
        if (!project || !estimate) return;

        const newComment: Comment = {
            id: generateId(),
            author: 'Клиент',
            text: commentText,
            timestamp: new Date().toISOString()
        };

        const updatedEstimate = {
            ...estimate,
            items: estimate.items.map(item =>
                item.id === itemId ? { ...item, comments: [...(item.comments || []), newComment] } : item
            )
        };
        setEstimate(updatedEstimate);
        
        // This is tricky without a backend. We'll update the public store.
        const allProjects = _get<Project[]>('prorab_projects_all', []);
        const updatedProjects = allProjects.map(p => {
            if (p.id === project.id) {
                return { ...p, estimates: p.estimates.map(e => e.id === estimate.id ? updatedEstimate : e) };
            }
            return p;
        });
        _set('prorab_projects_all', updatedProjects);
    };

    if (loading) return <Loader fullScreen />;
    if (error) return <div className="app-container"><div className="auth-error">{error}</div></div>;
    if (!project || !estimate) return null;

    const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
    const total = subtotal - discountAmount;
    
    return (
        <div className="public-estimate-container">
            <div className="public-header">
                <a href={window.location.origin + window.location.pathname} className="header-logo" aria-label="На главную">
                    <LogoIcon />
                    <span>Прораб</span>
                </a>
                <button className="btn btn-secondary btn-sm print-button" onClick={() => window.print()}>
                    <PrintIcon /> Печать / PDF
                </button>
            </div>
            
            <div className="card contractor-card">
                {project.contractor?.logo ? (
                     <img src={project.contractor.logo} alt="Логотип исполнителя" className="contractor-logo" />
                ) : (
                    <div className="logo-placeholder"><ImageIcon /></div>
                )}
                <div className="contractor-info">
                    <strong>{project.contractor?.companyName || project.contractor?.contactName}</strong>
                    <p>{project.contractor?.phone}</p>
                </div>
            </div>

            <div className="card">
                <div className="project-details-header">
                    <h2>Смета: {estimate.name}</h2>
                    <p><strong>Объект:</strong> {project.name}, {project.address}</p>
                    <p><strong>Заказчик:</strong> {project.client.name}, {project.client.phone}</p>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Позиция</th>
                                <th className="align-right">Кол-во</th>
                                <th className="align-right">Цена</th>
                                <th className="align-right">Итог</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {estimate.items.map(item => (
                                <tr key={item.id}>
                                    <td><strong>{item.name}</strong><br/><small>{item.type}</small></td>
                                    <td className="align-right">{item.quantity} {item.unit}</td>
                                    <td className="align-right">{formatCurrency(item.price)}</td>
                                    <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                    <td className="align-right">
                                        <button className="action-btn comment-btn" onClick={() => { setCommentingItem(item); setShowCommentModal(true); }}>
                                            <CommentIcon />
                                            {(item.comments?.length || 0) > 0 && <span className="comment-badge">{item.comments.length}</span>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="estimate-summary-container">
                    <div />
                    <div className="estimate-totals">
                        <div className="total-row"><span>Подытог</span><span>{formatCurrency(subtotal)}</span></div>
                        {discountAmount > 0 && (
                            <div className="total-row discount-row">
                                <span>Скидка</span>
                                <span>- {formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="total-row grand-total"><span>Итого</span><span>{formatCurrency(total)}</span></div>
                    </div>
                </div>
            </div>
            
            {(project.photoReports || []).length > 0 && (
                <div className="card">
                    <h3>Фотоотчеты</h3>
                    <div className="photo-reports-grid public-view">
                         {(project.photoReports || []).map(report => (
                            <div key={report.id} className="photo-report-card-public">
                                <img src={report.image} alt={report.description} />
                                <div className="photo-report-info-public">
                                    <p>{report.description}</p>
                                    <small>{new Date(report.date).toLocaleDateString('ru-RU')}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="approval-section">
                {estimate.approvedOn ? (
                    <div className="approval-status approved">
                        <CheckIcon/>
                        <div>
                            <strong>Смета согласована</strong>
                            <p>Заказчик утвердил эту смету {new Date(estimate.approvedOn).toLocaleString('ru-RU')}.</p>
                        </div>
                    </div>
                ) : (
                     <>
                        <p>Пожалуйста, внимательно ознакомьтесь со сметой. Если у вас есть вопросы, свяжитесь с исполнителем. Если все верно, нажмите кнопку "Согласовать смету".</p>
                        <button className="btn btn-primary btn-large" onClick={handleApprove}>Согласовать смету</button>
                    </>
                )}
            </div>

            <footer className="public-footer">
                <p>
                    Смета сформирована в&nbsp;
                    <a href={window.location.origin + window.location.pathname} className="footer-logo-link" target="_blank" rel="noopener noreferrer">
                        <LogoIcon size={16}/> Прораб
                    </a>
                </p>
            </footer>
             <CommentModal
                show={showCommentModal}
                onClose={() => setShowCommentModal(false)}
                item={commentingItem}
                onAddComment={handleAddComment}
            />
        </div>
    );
};

const Header = ({ user, onNavigate, onLogout }: { user: User | null, onNavigate: (view: ViewState) => void, onLogout: () => void }) => {
    return (
        <header>
            <div className="header-content">
                 <a href="#" onClick={(e) => { e.preventDefault(); onNavigate({ view: 'projects' }); }} className="header-logo" aria-label="На главную">
                    <LogoIcon />
                    <span>Прораб</span>
                </a>
                <div className="header-actions">
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'reports' })} aria-label="Отчеты"><ReportsIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'directory' })} aria-label="Справочник"><DirectoryIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'inventory' })} aria-label="Инвентарь"><ToolIcon /></button>
                     <button className="settings-btn" onClick={() => onNavigate({ view: 'settings' })} aria-label="Настройки"><SettingsIcon /></button>
                     <button className="settings-btn" onClick={onLogout} aria-label="Выход"><LogoutIcon /></button>
                </div>
            </div>
        </header>
    );
};

const BottomNav = ({ currentView, onNavigate }: { currentView: ViewState['view'], onNavigate: (view: ViewState) => void }) => {
    const navItems = [
        { view: 'projects' as const, label: 'Проекты', icon: <ProjectsIcon /> },
        { view: 'reports' as const, label: 'Отчеты', icon: <ReportsIcon /> },
        { view: 'directory' as const, label: 'Справочник', icon: <DirectoryIcon /> },
        { view: 'inventory' as const, label: 'Инвентарь', icon: <ToolIcon /> },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.view}
                    className={`bottom-nav-btn ${currentView === item.view ? 'active' : ''}`}
                    onClick={() => onNavigate({ view: item.view })}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const ProjectListView = ({ projects, onSelectProject, onShowNewProjectModal }: { projects: Project[], setProjects: React.Dispatch<React.SetStateAction<Project[]>>, onSelectProject: (projectId: string) => void, onShowNewProjectModal: () => void }) => {
    const [filter, setFilter] = useState<'В работе' | 'Завершен'>('В работе');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.status === filter)
            .filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.client.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [projects, filter, searchTerm]);

    return (
        <>
            <div className="d-flex justify-between align-center mb-1">
                <div className="filter-toggle">
                    <button className={filter === 'В работе' ? 'active' : ''} onClick={() => setFilter('В работе')}>В работе</button>
                    <button className={filter === 'Завершен' ? 'active' : ''} onClick={() => setFilter('Завершен')}>Завершен</button>
                </div>
            </div>
            
            <div className="search-container">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Поиск по названию, адресу, клиенту..."
                    className="search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredProjects.length > 0 ? (
                <div className="project-list-grid">
                    {filteredProjects.map((p, index) => (
                        <div key={p.id} className="card project-card animate-fade-slide-up" style={{ animationDelay: `${index * 50}ms` }} onClick={() => onSelectProject(p.id)}>
                            <div className="project-card-header">
                                <div>
                                    <div className="project-card-title">{p.name}</div>
                                    <div className="project-card-client">{p.client.name}</div>
                                </div>
                                <span className={`status-badge ${p.status === 'В работе' ? 'status-in-progress' : 'status-completed'}`}>
                                    {p.status}
                                </span>
                            </div>
                            <FinancialDashboard project={p} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <h3>Проектов пока нет</h3>
                    <p>{searchTerm ? `Не найдено проектов по запросу "${searchTerm}"` : `У вас пока нет проектов со статусом "${filter}".`}</p>
                    {filter === 'В работе' && !searchTerm && <button className="btn btn-primary" onClick={onShowNewProjectModal}>Создать первый проект</button>}
                </div>
            )}

            {filter === 'В работе' && <button className="fab" onClick={onShowNewProjectModal} aria-label="Новый проект">+</button>}
        </>
    );
};

const SettingsView = ({ profile, onSave, onLogout }: { profile: UserProfile, onSave: (profile: UserProfile) => Promise<void>, onLogout: () => void }) => {
    const [formData, setFormData] = useState(profile);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, logo: base64 }));
            } catch (err) {
                addToast('Не удалось загрузить логотип', 'error');
            }
        }
    };
    
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            addToast('Профиль сохранен', 'success');
        } catch (err) {
            addToast('Не удалось сохранить', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <div className="card">
            <h3>Настройки профиля</h3>
            <form onSubmit={handleSave}>
                <div className="d-flex align-center gap-1 mb-1">
                    {formData.logo ? (
                        <img src={formData.logo} alt="Логотип" className="logo-preview" />
                    ) : (
                        <div className="logo-placeholder"><ImageIcon /></div>
                    )}
                    <div>
                        <label htmlFor="logo-upload" className="btn btn-secondary btn-sm">Загрузить лого</label>
                        <input id="logo-upload" type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
                        <p className="field-hint">Рекомендуется квадратное изображение</p>
                    </div>
                </div>
                <div className="form-group">
                    <label>Название компании / ИП</label>
                    <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                </div>
                <div className="form-group">
                    <label>Контактное лицо</label>
                    <input type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} required />
                </div>
                <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-actions" style={{justifyContent: 'space-between'}}>
                    <button type="button" className="btn btn-secondary" onClick={onLogout}>Выйти</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader /> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const InventoryView = ({ inventory, setInventory, notes, setNotes, projects, userKey }: { inventory: InventoryItem[], setInventory: Dispatch<SetStateAction<InventoryItem[]>>, notes: ProjectNote[], setNotes: Dispatch<SetStateAction<ProjectNote[]>>, projects: Project[], userKey: string }) => {
    const { addToast } = useToasts();
    const [showItemModal, setShowItemModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newNoteText, setNewNoteText] = useState('');

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        const newItem: InventoryItem = {
            id: generateId(),
            name: newItemName.trim(),
            location: 'На базе',
        };
        const updatedInventory = [...inventory, newItem];
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
        setNewItemName('');
        setShowItemModal(false);
    };
    
    const handleDeleteItem = async (itemId: string) => {
        if (!window.confirm('Удалить инструмент?')) return;
        const updatedInventory = inventory.filter(i => i.id !== itemId);
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
    };

    const handleLocationChange = async (itemId: string, location: string) => {
        const updatedInventory = inventory.map(i => i.id === itemId ? {...i, location} : i);
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;
        const newNote: ProjectNote = {
            id: generateId(),
            text: newNoteText.trim(),
            createdAt: new Date().toISOString(),
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        await api.saveData(userKey, 'inventory_notes', updatedNotes);
        setNewNoteText('');
    };
    
    const handleDeleteNote = async (noteId: string) => {
        const updatedNotes = notes.filter(n => n.id !== noteId);
        setNotes(updatedNotes);
        await api.saveData(userKey, 'inventory_notes', updatedNotes);
    };

    const activeProjects = projects.filter(p => p.status === 'В работе');

    return (
        <>
            <div className="card">
                <div className="d-flex justify-between align-center mb-1">
                    <h3>Инструменты и оборудование</h3>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowItemModal(true)}>+ Добавить</button>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr><th>Наименование</th><th>Местоположение</th><th></th></tr>
                        </thead>
                        <tbody>
                            {inventory.length === 0 ? (
                                <tr><td colSpan={3} style={{textAlign: 'center', padding: '1rem'}}>Инструменты не добавлены</td></tr>
                            ) : (
                                inventory.map(item => (
                                    <tr key={item.id}>
                                        <td><strong>{item.name}</strong></td>
                                        <td>
                                            <select value={item.location} onChange={(e) => handleLocationChange(item.id, e.target.value)} style={{maxWidth: '200px', padding: 'var(--space-2)'}}>
                                                <option value="На базе">На базе</option>
                                                {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="align-right">
                                            <button className="action-btn" onClick={() => handleDeleteItem(item.id)}><DeleteIcon /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="card">
                <h3>Заметки по инвентарю</h3>
                 {notes.map(note => (
                    <div key={note.id} className="data-item">
                        <div className="data-item-info">
                            <p>{note.text}</p>
                            <span className="data-item-subtext">{new Date(note.createdAt).toLocaleString('ru-RU')}</span>
                        </div>
                        <button className="action-btn" onClick={() => handleDeleteNote(note.id)} aria-label="Удалить заметку">
                            <DeleteIcon />
                        </button>
                    </div>
                 ))}
                 <form onSubmit={handleAddNote} className="add-note-form">
                    <input type="text" value={newNoteText} onChange={e => setNewNoteText(e.target.value)} placeholder="Что-то сломалось или нужно купить..."/>
                    <button type="submit" className="btn btn-primary btn-sm">Добавить</button>
                </form>
            </div>
            
            <Modal show={showItemModal} onClose={() => setShowItemModal(false)} title="Добавить инструмент">
                <form onSubmit={handleAddItem}>
                    <div className="form-group">
                        <label>Название</label>
                        <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Например, Перфоратор Makita" required/>
                    </div>
                     <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Добавить</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};


// --- APP INITIALIZATION ---
const queryParams = new URLSearchParams(window.location.search);
const isPublicView = queryParams.has('view') && queryParams.get('view') === 'estimate';

const AppWrapper = () => (
    <ToastProvider>
        {isPublicView ? <PublicEstimateView /> : <App />}
    </ToastProvider>
);

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<AppWrapper />);
}
