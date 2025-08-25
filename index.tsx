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
        _set(`prorab_${dataType}_${userKey}`, data);
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
const EstimateEditor = ({ estimate, projectId, onUpdate, onDelete, directory, setDirectory, userKey, onSaveTemplate }: EstimateEditorProps) => {
    const [showModal, setShowModal] = useState(false);
    const [showShoppingListModal, setShowShoppingListModal] = useState(false);
    const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
    const [newItem, setNewItem] = useState<Omit<EstimateItem, 'id'>>({ name: '', type: 'Работа', unit: 'шт', quantity: 1, price: 0 });
    const [suggestions, setSuggestions] = useState<DirectoryItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(estimate.discount?.type || 'percent');
    const [discountValue, setDiscountValue] = useState<number>(estimate.discount?.value || 0);
    const [estimateName, setEstimateName] = useState(estimate.name);

    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);

    useEffect(() => {
        setDiscountType(estimate.discount?.type || 'percent');
        setDiscountValue(estimate.discount?.value || 0);
        setEstimateName(estimate.name);
    }, [estimate]);

    const isEditing = editingItem !== null;

    const subtotal = useMemo(() => estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0), [estimate.items]);
    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return subtotal * (discountValue / 100);
        }
        return discountValue;
    }, [subtotal, discountType, discountValue]);
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
        setNewItem({ name: '', type: 'Работа', unit: 'шт', quantity: 1, price: 0 });
        setShowModal(true);
    };

    const openModalForEdit = (item: EstimateItem) => {
        setEditingItem(item);
        setNewItem({ ...item });
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
        try {
            let updatedItems;
            if (isEditing && editingItem) { // Update existing item
                updatedItems = estimate.items.map(item => item.id === editingItem.id ? { ...item, ...newItem, name: trimmedName } : item);
            } else { // Add new item
                const itemWithId: EstimateItem = { ...newItem, name: trimmedName, id: generateId() };
                updatedItems = [...estimate.items, itemWithId];
            }
            await onUpdate({ ...estimate, items: updatedItems });
            
            const isInDirectory = directory.some(dirItem => dirItem.name.toLowerCase() === trimmedName.toLowerCase());
            if (!isInDirectory) {
                const newDirectoryItem: DirectoryItem = { id: generateId(), name: trimmedName, type: newItem.type, unit: newItem.unit, price: newItem.price };
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

    const handleDiscountChange = async (type: 'percent' | 'fixed', value: number) => {
        try {
            const newDiscount: Discount = { type, value };
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
            price: suggestion.price,
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
                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
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
                             <span>Скидка ({discountType === 'percent' ? `${discountValue}%` : formatCurrency(discountValue)})</span>
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
                           <input type="number" step="any" value={newItem.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})} required disabled={isSaving}/>
                        </div>
                        <div className="form-group w-100">
                           <label>Ед. изм.</label>
                           <input type="text" value={newItem.unit} placeholder="шт, м², час" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, unit: e.target.value})} required disabled={isSaving}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Цена за единицу</label>
                        <input type="number" step="0.01" value={newItem.price} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItem({...newItem, price: parseFloat(e.target.value) || 0})} required disabled={isSaving}/>
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
    const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().split('T')[0], description: '', amount: 0 });
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
        try {
            if (entryType === 'expense') {
                let receiptDataUrl: string | undefined = undefined;
                if (receiptFile) {
                    receiptDataUrl = await fileToBase64(receiptFile);
                }
                const expenseWithId: Expense = { ...newEntry, id: generateId(), receipt: receiptDataUrl };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, expenses: [...p.expenses, expenseWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            } else {
                const paymentWithId: Payment = { id: generateId(), date: newEntry.date, amount: newEntry.amount };
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, payments: [...p.payments, paymentWithId] } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
            }
            addToast('Операция добавлена', 'success');
            setShowModal(false);
            setNewEntry({ date: new Date().toISOString().split('T')[0], description: '', amount: 0 });
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
                        <input type="number" step="0.01" value={newEntry.amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({...newEntry, amount: parseFloat(e.target.value) || 0})} required disabled={isSaving}/>
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
    
    const photoReports = project.photoReports || [];

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
                    {photoReports.map(report => (
                        <div key={report.id} className="photo-report-card">
                            <img src={report.image} alt={report.description} />
                            <div className="photo-report-info">
                                <p>{report.description}</p>
                                <small>{new Date(report.date).toLocaleDateString('ru-RU')}</small>
                            </div>
                            <button className="photo-report-delete-btn action-btn" onClick={() => handleDeleteReport(report.id)} aria-label="Удалить фотоотчет">
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
        </div>
    );
};


interface ProjectEditModalProps {
    project: Project;
    projects: Project[];
    show: boolean;
    onClose: () => void;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userKey: string;
}
const ProjectEditModal = ({ project, projects, show, onClose, setProjects, userKey }: ProjectEditModalProps) => {
    const [editedProject, setEditedProject] = useState({ name: '', address: '', clientName: '', clientPhone: '' });
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();
    
    useEffect(() => {
        if (project) {
            setEditedProject({
                name: project.name,
                address: project.address,
                clientName: project.client.name,
                clientPhone: project.client.phone
            });
        }
    }, [project, show]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedProjects = projects.map(p => p.id === project.id ? {
                ...p,
                name: editedProject.name,
                address: editedProject.address,
                client: { name: editedProject.clientName, phone: editedProject.clientPhone }
            } : p);
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Проект сохранен', 'success');
            onClose();
        } catch (error) {
            addToast('Не удалось сохранить проект', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onClose={() => !isSaving && onClose()} title="Редактировать проект">
            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" value={editedProject.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedProject({ ...editedProject, name: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" value={editedProject.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedProject({ ...editedProject, address: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" value={editedProject.clientName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedProject({ ...editedProject, clientName: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" value={editedProject.clientPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedProject({ ...editedProject, clientPhone: e.target.value })} required disabled={isSaving}/>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader/> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ActGenerationModalProps {
    show: boolean;
    onClose: () => void;
    project: Project | null;
}
const ActGenerationModal = ({ show, onClose, project }: ActGenerationModalProps) => {
    const [generatedAct, setGeneratedAct] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { addToast } = useToasts();

    const handleGenerate = useCallback(async () => {
        if (!project) return;
        setIsGenerating(true);
        setGeneratedAct('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const total = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);

            const prompt = `
                Составь официальный документ "Акт сдачи-приемки выполненных работ".
                Используй следующие данные:
                - Город: (оставь пустым, если не указан в адресе)
                - Дата: ${new Date().toLocaleDateString('ru-RU')} г.
                - Исполнитель: ${project.contractor?.companyName || project.contractor?.contactName || 'Исполнитель'}
                - Заказчик: ${project.client.name}
                - Объект: "${project.name}" по адресу ${project.address}
                - Общая сумма работ по смете: ${formatCurrency(total)} (${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', currencyDisplay: 'name' }).formatToParts(total).map(p=>p.value).join('')})

                В тексте акта укажи, что исполнитель выполнил все работы в полном объеме и в установленные сроки, а заказчик принял работы и не имеет претензий к качеству и объему.
                В конце документа оставь места для подписей: "Исполнитель _______________" и "Заказчик _______________".
                Структурируй документ четко, с заголовком, преамбулой, основной частью и реквизитами сторон.
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text;
            setGeneratedAct(text);

        } catch (error) {
            console.error("Gemini API error:", error);
            addToast('Не удалось сгенерировать акт. Попробуйте позже.', 'error');
            setGeneratedAct('Произошла ошибка при генерации документа. Проверьте API-ключ и повторите попытку.');
        } finally {
            setIsGenerating(false);
        }
    }, [project, addToast]);

    useEffect(() => {
        if (show) {
            handleGenerate();
        }
    }, [show, handleGenerate]);

    const handleCopy = () => {
        if (!generatedAct) return;
        navigator.clipboard.writeText(generatedAct).then(() => {
            addToast('Акт скопирован в буфер обмена!', 'success');
        }, () => {
            addToast('Не удалось скопировать текст.', 'error');
        });
    };

    return (
        <Modal show={show} onClose={onClose} title="Генерация Акта выполненных работ">
            {isGenerating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
                    <Loader />
                    <p>Нейросеть составляет документ...</p>
                </div>
            ) : (
                <>
                    <textarea 
                        className="act-textarea"
                        value={generatedAct}
                        onChange={(e) => setGeneratedAct(e.target.value)}
                        rows={15}
                        readOnly={isGenerating}
                    />
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Закрыть</button>
                        <button type="button" className="btn btn-primary" onClick={handleCopy} disabled={!generatedAct}>
                           Скопировать
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};


interface NotesComponentProps {
    notes: ProjectNote[];
    onUpdate: (notes: ProjectNote[]) => void;
    title: string;
}
const NotesComponent = ({ notes, onUpdate, title }: NotesComponentProps) => {
    const [newNoteText, setNewNoteText] = useState('');
    const [editingNote, setEditingNote] = useState<ProjectNote | null>(null);
    const [editedText, setEditedText] = useState('');
    const { addToast } = useToasts();

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;

        const newNote: ProjectNote = {
            id: generateId(),
            text: newNoteText.trim(),
            createdAt: new Date().toISOString(),
        };
        onUpdate([...notes, newNote]);
        setNewNoteText('');
        addToast('Заметка добавлена', 'success');
    };

    const handleDeleteNote = (id: string) => {
        if (window.confirm('Удалить эту заметку?')) {
            onUpdate(notes.filter(note => note.id !== id));
            addToast('Заметка удалена', 'success');
        }
    };

    const openEditModal = (note: ProjectNote) => {
        setEditingNote(note);
        setEditedText(note.text);
    };

    const handleSaveEditedNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNote || !editedText.trim()) return;

        const updatedNotes = notes.map(note =>
            note.id === editingNote.id ? { ...note, text: editedText.trim() } : note
        );
        onUpdate(updatedNotes);
        setEditingNote(null);
        addToast('Заметка обновлена', 'success');
    };

    return (
        <div className="card">
            <h3>{title}</h3>
            {notes.length === 0 ? (
                <div className="transaction-list-empty">Заметок пока нет.</div>
            ) : (
                <div className="data-list">
                    {notes.map(note => (
                        <div key={note.id} className="data-item">
                            <div className="data-item-info">
                                <p>{note.text}</p>
                            </div>
                            <div className="item-actions">
                                <button className="action-btn" onClick={() => openEditModal(note)}><EditIcon/></button>
                                <button className="action-btn" onClick={() => handleDeleteNote(note.id)}><DeleteIcon/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <form className="add-note-form" onSubmit={handleAddNote}>
                <input
                    type="text"
                    value={newNoteText}
                    onChange={e => setNewNoteText(e.target.value)}
                    placeholder="Новая заметка..."
                />
                <button type="submit" className="btn btn-primary">Добавить</button>
            </form>
            
            {editingNote && (
                 <Modal show={!!editingNote} onClose={() => setEditingNote(null)} title="Редактировать заметку">
                     <form onSubmit={handleSaveEditedNote}>
                         <div className="form-group">
                            <textarea
                                className="notes-textarea"
                                value={editedText}
                                onChange={e => setEditedText(e.target.value)}
                                rows={5}
                            />
                         </div>
                         <div className="form-actions">
                             <button type="button" className="btn btn-secondary" onClick={() => setEditingNote(null)}>Отмена</button>
                             <button type="submit" className="btn btn-primary">Сохранить</button>
                         </div>
                     </form>
                 </Modal>
            )}
        </div>
    );
};

interface ProjectScheduleProps {
    schedule: ProjectScheduleItem[];
    onUpdate: (schedule: ProjectScheduleItem[]) => void;
}
const ProjectSchedule = ({ schedule, onUpdate }: ProjectScheduleProps) => {
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectScheduleItem | null>(null);
    const [newItem, setNewItem] = useState<Omit<ProjectScheduleItem, 'id'>>({ name: '', startDate: '', endDate: '' });

    const openModalForNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', startDate: new Date().toISOString().split('T')[0], endDate: '' });
        setShowModal(true);
    };

    const openModalForEdit = (item: ProjectScheduleItem) => {
        setEditingItem(item);
        setNewItem({ ...item });
        setShowModal(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        let updatedSchedule;
        if (editingItem) {
            updatedSchedule = schedule.map(item => item.id === editingItem.id ? { ...item, ...newItem } : item);
        } else {
            updatedSchedule = [...schedule, { ...newItem, id: generateId() }];
        }
        onUpdate(updatedSchedule);
        setShowModal(false);
    };
    
    const handleDelete = (id: string) => {
        if(window.confirm('Удалить этот этап?')) {
            onUpdate(schedule.filter(item => item.id !== id));
        }
    };

    return (
        <div className="card">
            <div className="d-flex justify-between align-center mb-1">
                <h3>График работ</h3>
                <button className="btn btn-primary btn-sm" onClick={openModalForNew}>+ Добавить этап</button>
            </div>
            {schedule.length === 0 ? (
                <div className="transaction-list-empty">Этапы работ не запланированы.</div>
            ) : (
                <div className="data-list">
                    {schedule.map(item => (
                        <div key={item.id} className="data-item">
                            <div className="data-item-info">
                                <strong>{item.name}</strong>
                                <span className="data-item-subtext">
                                    {new Date(item.startDate).toLocaleDateString()} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : '...'}
                                </span>
                            </div>
                            <div className="item-actions">
                                <button className="action-btn" onClick={() => openModalForEdit(item)}><EditIcon/></button>
                                <button className="action-btn" onClick={() => handleDelete(item.id)}><DeleteIcon/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editingItem ? "Редактировать этап" : "Новый этап"}>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Название этапа</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required/>
                    </div>
                    <div className="d-flex gap-1">
                        <div className="form-group w-100">
                            <label>Дата начала</label>
                            <input type="date" value={newItem.startDate} onChange={e => setNewItem({...newItem, startDate: e.target.value})} required/>
                        </div>
                        <div className="form-group w-100">
                            <label>Дата окончания</label>
                            <input type="date" value={newItem.endDate} onChange={e => setNewItem({...newItem, endDate: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

interface ProjectDocumentsProps {
    documents: ProjectDocument[];
    onUpdate: (documents: ProjectDocument[]) => void;
}
const ProjectDocuments = ({ documents, onUpdate }: ProjectDocumentsProps) => {
    const { addToast } = useToasts();
    const [showModal, setShowModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [newDocument, setNewDocument] = useState({ name: '', file: null as File | null });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewDocument(prev => ({ ...prev, file: e.target.files![0], name: prev.name || e.target.files![0].name }));
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDocument.file) {
            addToast('Выберите файл для загрузки', 'error');
            return;
        }
        setIsUploading(true);
        try {
            const fileData = await fileToBase64(newDocument.file);
            const doc: ProjectDocument = {
                id: generateId(),
                name: newDocument.name,
                fileName: newDocument.file.name,
                file: fileData
            };
            onUpdate([...documents, doc]);
            setShowModal(false);
            setNewDocument({ name: '', file: null });
        } catch (err) {
            addToast('Ошибка загрузки файла', 'error');
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Удалить этот документ?')) {
            onUpdate(documents.filter(doc => doc.id !== id));
        }
    };

    return (
        <div className="card">
             <div className="d-flex justify-between align-center mb-1">
                <h3>Документы</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Загрузить</button>
            </div>
            {documents.length === 0 ? (
                 <div className="transaction-list-empty">Документов нет.</div>
            ) : (
                <div className="data-list">
                    {documents.map(doc => (
                        <div key={doc.id} className="data-item">
                            <div className="data-item-info">
                                <a href={doc.file} download={doc.fileName}>{doc.name}</a>
                                <span className="data-item-subtext">{doc.fileName}</span>
                            </div>
                            <div className="item-actions">
                                <button className="action-btn" onClick={() => handleDelete(doc.id)}><DeleteIcon/></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <Modal show={showModal} onClose={() => !isUploading && setShowModal(false)} title="Загрузить документ">
                <form onSubmit={handleUpload}>
                    <div className="form-group">
                        <label>Файл</label>
                        <input type="file" onChange={handleFileChange} required disabled={isUploading} />
                    </div>
                    <div className="form-group">
                        <label>Название документа (необязательно)</label>
                        <input type="text" value={newDocument.name} onChange={e => setNewDocument({...newDocument, name: e.target.value})} placeholder="Например, схема электрики" disabled={isUploading}/>
                    </div>
                     <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={isUploading}>Отмена</button>
                        <button type="submit" className="btn btn-primary" disabled={isUploading}>
                            {isUploading ? <Loader /> : 'Загрузить'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};


interface ProjectDetailsProps {
    project: Project;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    onBack: () => void;
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    templates: EstimateTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<EstimateTemplate[]>>;
    userKey: string;
}
const ProjectDetails = ({ project, projects, setProjects, onBack, directory, setDirectory, templates, setTemplates, userKey }: ProjectDetailsProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showActModal, setShowActModal] = useState(false);
    const { addToast } = useToasts();
    
    const handleToggleStatus = async () => {
        const newStatus: 'В работе' | 'Завершен' = project.status === 'В работе' ? 'Завершен' : 'В работе';
        const confirmationText = newStatus === 'Завершен' 
            ? 'Вы уверены, что хотите завершить проект?' 
            : 'Вы уверены, что хотите вернуть проект в работу?';
        
        if (window.confirm(confirmationText)) {
            try {
                const updatedProjects = projects.map(p => p.id === project.id ? { ...p, status: newStatus, completedAt: newStatus === 'Завершен' ? new Date().toISOString() : undefined } : p);
                setProjects(updatedProjects);
                await api.saveData(userKey, 'projects', updatedProjects);
                addToast(`Статус проекта изменен на "${newStatus}"`, 'success');
            } catch (e) {
                addToast('Не удалось изменить статус', 'error');
            }
        }
    };
    
    const updateProjectField = async <K extends keyof Project>(field: K, value: Project[K]) => {
        const updatedProjects = projects.map(p => p.id === project.id ? { ...p, [field]: value } : p);
        setProjects(updatedProjects);
        await api.saveData(userKey, 'projects', updatedProjects);
    };

    const handleUpdateEstimate = async (updatedEstimate: Estimate) => {
        const newEstimates = project.estimates.map(e => e.id === updatedEstimate.id ? updatedEstimate : e);
        await updateProjectField('estimates', newEstimates);
    };

    const handleAddEstimate = async () => {
        const newEstimateName = `Доп. смета #${project.estimates.length + 1}`;
        const newEstimate: Estimate = {
            id: generateId(),
            name: newEstimateName,
            items: [],
            discount: { type: 'percent', value: 0 },
        };
        await updateProjectField('estimates', [...project.estimates, newEstimate]);
        addToast('Новая смета добавлена', 'success');
    };

    const handleDeleteEstimate = async (estimateId: string) => {
        if (project.estimates.length <= 1) {
            addToast('Нельзя удалить последнюю смету', 'error');
            return;
        }
        if (window.confirm('Вы уверены, что хотите удалить эту смету? Это действие нельзя отменить.')) {
            const updatedEstimates = project.estimates.filter(e => e.id !== estimateId);
            await updateProjectField('estimates', updatedEstimates);
            addToast('Смета удалена', 'success');
        }
    };

     const handleSaveTemplate = async (template: EstimateTemplate) => {
        const updatedTemplates = [...templates, template];
        setTemplates(updatedTemplates);
        await api.saveData(userKey, 'templates', updatedTemplates);
        addToast('Шаблон сохранен!', 'success');
    };

    return (
        <div className="animate-fade-slide-up">
            <button onClick={onBack} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                <span>Все проекты</span>
            </button>
            <div className="project-details-header">
                <div className="d-flex justify-between align-start">
                    <div>
                        <h2>{project.name}</h2>
                        <p>{project.address} &bull; {project.client.name}, {project.client.phone}</p>
                    </div>
                    <div className="project-header-actions">
                         <button className="action-btn" onClick={() => setIsEditing(true)} aria-label="Редактировать проект"><EditIcon /></button>
                         <button className="action-btn" onClick={handleToggleStatus} aria-label={project.status === 'В работе' ? "Завершить проект" : "Вернуть в работу"}>
                             {project.status === 'В работе' ? <CheckIcon /> : <ReplayIcon />}
                         </button>
                          {project.status === 'Завершен' && (
                            <button className="action-btn" onClick={() => setShowActModal(true)} aria-label="Создать Акт выполненных работ">
                                <DocumentIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <FinancialDashboard project={project} />

            <NotesComponent title="Заметки по проекту" notes={project.notes || []} onUpdate={(notes) => updateProjectField('notes', notes)} />
            <ProjectSchedule schedule={project.schedule || []} onUpdate={(schedule) => updateProjectField('schedule', schedule)} />
            <ProjectDocuments documents={project.documents || []} onUpdate={(documents) => updateProjectField('documents', documents)} />

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
                        onSaveTemplate={handleSaveTemplate}
                        userKey={userKey}
                    />
                ))}
            </div>

            <div className="d-flex" style={{justifyContent: 'center', marginTop: 'var(--space-6)'}}>
                 <button className="btn btn-secondary" onClick={handleAddEstimate}>+ Создать смету</button>
            </div>

            <ExpenseTracker project={project} projects={projects} setProjects={setProjects} userKey={userKey}/>
            <PhotoReports project={project} projects={projects} setProjects={setProjects} userKey={userKey} />

            <ProjectEditModal project={project} projects={projects} show={isEditing} onClose={() => setIsEditing(false)} setProjects={setProjects} userKey={userKey}/>
            <ActGenerationModal show={showActModal} onClose={() => setShowActModal(false)} project={project} />
        </div>
    );
};

interface ProjectCreationModalProps {
    show: boolean;
    onClose: () => void;
    projects: Project[];
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    userProfile: UserProfile;
    templates: EstimateTemplate[];
    userKey: string;
}
const ProjectCreationModal = ({ show, onClose, projects, setProjects, userProfile, templates, userKey }: ProjectCreationModalProps) => {
    const [newProject, setNewProject] = useState({ name: '', address: '', clientName: '', clientPhone: '' });
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            const initialEstimateItems = selectedTemplate 
                ? selectedTemplate.items.map(item => ({...item, id: generateId(), quantity: 1 })) 
                : [];
            
            const project: Project = {
                id: generateId(),
                name: newProject.name,
                address: newProject.address,
                status: 'В работе',
                client: { name: newProject.clientName, phone: newProject.clientPhone },
                estimates: [{
                    id: generateId(),
                    name: selectedTemplate ? selectedTemplate.name : 'Основная смета',
                    items: initialEstimateItems,
                    discount: { type: 'percent', value: 0 }
                }],
                expenses: [],
                payments: [],
                photoReports: [],
                notes: [],
                schedule: [],
                documents: [],
                contractor: userProfile,
                createdAt: new Date().toISOString()
            };
            const updatedProjects = [project, ...projects];
            setProjects(updatedProjects);
            await api.saveData(userKey, 'projects', updatedProjects);
            addToast('Проект создан!', 'success');
            setNewProject({ name: '', address: '', clientName: '', clientPhone: '' });
            setSelectedTemplateId('');
            onClose();
        } catch (error) {
            addToast('Не удалось создать проект', 'error');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClose = () => {
        if(isSaving) return;
        setNewProject({ name: '', address: '', clientName: '', clientPhone: '' });
        setSelectedTemplateId('');
        onClose();
    }

    return (
        <Modal show={show} onClose={handleClose} title="Новый проект">
            <form onSubmit={handleCreateProject}>
                {templates.length > 0 && (
                     <div className="form-group">
                        <label>Начать с шаблона (необязательно)</label>
                        <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} disabled={isSaving}>
                            <option value="">-- Новый проект --</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" placeholder="Ремонт квартиры на Лесной" value={newProject.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, name: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Адрес</label>
                    <input type="text" placeholder="г. Москва, ул. Лесная, д. 5, кв. 10" value={newProject.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, address: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Имя клиента</label>
                    <input type="text" placeholder="Иван Петров" value={newProject.clientName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, clientName: e.target.value })} required disabled={isSaving}/>
                </div>
                 <div className="form-group">
                    <label>Телефон клиента</label>
                    <input type="tel" placeholder="+7 (999) 123-45-67" value={newProject.clientPhone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({ ...newProject, clientPhone: e.target.value })} required disabled={isSaving}/>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader/> : 'Создать'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ProfileModalProps {
    show: boolean;
    onClose: () => void;
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    userKey: string;
}
const ProfileModal = ({ show, onClose, profile, setProfile, userKey }: ProfileModalProps) => {
    const [formData, setFormData] = useState<UserProfile>(profile);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToasts();

    useEffect(() => {
        if (show) {
            setFormData(profile);
        }
    }, [profile, show]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                setFormData(prev => ({ ...prev, logo: base64 }));
            } catch (error) {
                console.error("Error converting file to base64", error);
                addToast("Не удалось загрузить файл.", "error");
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            setProfile(formData);
            await api.saveData(userKey, 'profile', formData);
            addToast('Профиль сохранен', 'success');
            onClose();
        } catch (error) {
            addToast('Не удалось сохранить профиль', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal show={show} onClose={() => !isSaving && onClose()} title="Профиль исполнителя">
            <form onSubmit={handleSave}>
                <div className="form-group">
                     <label>Логотип</label>
                    <div className="d-flex align-center gap-1">
                        <div className="logo-preview-container">
                            {formData.logo ? (
                                 <img src={formData.logo} alt="Логотип" className="logo-preview" />
                            ) : (
                                <div className="logo-placeholder"><ImageIcon/></div>
                            )}
                        </div>
                        <div>
                            <input type="file" id="logo-upload" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} disabled={isSaving}/>
                            <label htmlFor="logo-upload" className={`btn btn-secondary btn-sm ${isSaving ? 'disabled' : ''}`}>Загрузить</label>
                            <p className="field-hint">Квадратное изображение</p>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Название компании</label>
                    <input type="text" placeholder="ИП Петров / Бригада 'Мастер'" value={formData.companyName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, companyName: e.target.value })} disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Контактное лицо</label>
                    <input type="text" placeholder="Иван Петров" value={formData.contactName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, contactName: e.target.value })} disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Телефон</label>
                    <input type="tel" placeholder="+7 (999) 123-45-67" value={formData.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })} disabled={isSaving}/>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader/> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface ProjectListProps {
    projects: Project[];
    onSelectProject: (id: string) => void;
    onNewProject: () => void;
}
const ProjectList = ({ projects, onSelectProject, onNewProject }: ProjectListProps) => {
    const [statusFilter, setStatusFilter] = useState<'В работе' | 'Завершен'>('В работе');
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredProjects = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return projects
            .filter(p => p.status === statusFilter)
            .filter(p => {
                if (!lowercasedQuery) return true;
                return (
                    p.name.toLowerCase().includes(lowercasedQuery) ||
                    p.address.toLowerCase().includes(lowercasedQuery) ||
                    p.client.name.toLowerCase().includes(lowercasedQuery)
                );
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [projects, statusFilter, searchQuery]);

    return (
        <div>
            <div className="d-flex justify-between align-center mb-1">
                <h2>Проекты</h2>
                <div className="filter-toggle">
                    <button className={statusFilter === 'В работе' ? 'active' : ''} onClick={() => setStatusFilter('В работе')}>В работе</button>
                    <button className={statusFilter === 'Завершен' ? 'active' : ''} onClick={() => setStatusFilter('Завершен')}>Завершенные</button>
                </div>
            </div>

            <div className="search-container">
                <SearchIcon />
                <input
                    type="text"
                    placeholder="Поиск по названию, адресу, клиенту..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredProjects.length === 0 ? (
                <div className="empty-state">
                    {projects.length === 0 ? (
                        <>
                            <p>У вас пока нет проектов. <br/>Начните с создания первого!</p>
                            <button className="btn btn-primary" onClick={onNewProject}>Создать первый проект</button>
                        </>
                    ) : searchQuery ? (
                        <p>Проекты по запросу "{searchQuery}" не найдены.</p>
                    ) : (
                         <p>Нет проектов со статусом "{statusFilter}".</p>
                    )}
                </div>
            ) : (
                <div className="project-list-grid">
                    {filteredProjects.map((p, index) => (
                         <div key={p.id} className="card project-card animate-fade-slide-up" onClick={() => onSelectProject(p.id)} style={{ animationDelay: `${index * 75}ms` }}>
                             <div className="project-card-header">
                                <div>
                                    <div className="project-card-title">{p.name}</div>
                                    <div className="project-card-client">{p.client.name}</div>
                                </div>
                                <span className={`status-badge ${p.status === 'В работе' ? 'status-in-progress' : 'status-completed'}`}>{p.status}</span>
                            </div>
                            <FinancialDashboard project={p} />
                         </div>
                    ))}
                </div>
            )}
            <button className="fab" onClick={onNewProject} aria-label="Новый проект">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/></svg>
            </button>
        </div>
    );
};

const PublicEstimateView = () => {
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const projectId = urlParams.get('projectId');
    const estimateId = urlParams.get('estimateId');

    const [project, setProject] = useState<Project | null | undefined>(undefined);
    const [estimate, setEstimate] = useState<Estimate | null | undefined>(undefined);
    const [isApproving, setIsApproving] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [commentingItem, setCommentingItem] = useState<EstimateItem | null>(null);

    const openCommentModal = (item: EstimateItem) => {
        setCommentingItem(item);
        setShowCommentModal(true);
    };

    const handleAddComment = (itemId: string, commentText: string) => {
        const newComment: Comment = {
            id: generateId(),
            author: 'Клиент',
            text: commentText,
            timestamp: new Date().toISOString()
        };
        
        try {
            const allProjects = _get<Project[]>('prorab_projects_all', []);
            const updatedProjects = allProjects.map(p => {
                if (p.id === projectId) {
                    const updatedEstimates = p.estimates.map(e => {
                        if (e.id === estimateId) {
                            const updatedItems = e.items.map(item => {
                                if (item.id === itemId) {
                                    return { ...item, comments: [...(item.comments || []), newComment] };
                                }
                                return item;
                            });
                            return { ...e, items: updatedItems };
                        }
                        return e;
                    });
                    return { ...p, estimates: updatedEstimates };
                }
                return p;
            });
            _set('prorab_projects_all', updatedProjects);

            // Update local state to reflect change immediately
            setEstimate(prev => {
                if (!prev) return null;
                const updatedItems = prev.items.map(item => {
                    if (item.id === itemId) {
                         return { ...item, comments: [...(item.comments || []), newComment] };
                    }
                    return item;
                });
                return { ...prev, items: updatedItems };
            });
            
        } catch(e) {
            console.error("Error saving comment", e);
            alert("Не удалось сохранить комментарий.");
        }
    };


    useEffect(() => {
        try {
            const allProjects = JSON.parse(localStorage.getItem('prorab_projects_all') || '[]') as Project[];
            const foundProject = allProjects.find(p => p.id === projectId);
            if (foundProject) {
                const foundEstimate = foundProject.estimates.find(e => e.id === estimateId);
                setProject(foundProject);
                setEstimate(foundEstimate || null);
            } else {
                 setProject(null);
                 setEstimate(null);
            }
        } catch (e) {
            setProject(null);
            setEstimate(null);
        }
    }, [projectId, estimateId]);

    const handleApprove = () => {
        if (!project || !estimate || !window.confirm('Вы уверены, что хотите согласовать эту смету? Это действие нельзя отменить.')) return;

        setIsApproving(true);
        const approvalDate = new Date().toISOString();

        try {
            setTimeout(() => {
                const updateInStorage = (key: string) => {
                    const storedProjects = JSON.parse(localStorage.getItem(key) || '[]') as Project[];
                    const updatedProjects = storedProjects.map(p => {
                        if (p.id === projectId) {
                            const updatedEstimates = p.estimates.map(e => e.id === estimateId ? { ...e, approvedOn: approvalDate } : e);
                            return { ...p, estimates: updatedEstimates };
                        }
                        return p;
                    });
                    localStorage.setItem(key, JSON.stringify(updatedProjects));
                };

                updateInStorage('prorab_projects_all');

                const projectKeys = Object.keys(localStorage).filter(k => k.startsWith('prorab_projects_') && k !== 'prorab_projects_all');
                for (const key of projectKeys) {
                   if (JSON.parse(localStorage.getItem(key) || '[]').some((p: Project) => p.id === projectId)) {
                        updateInStorage(key);
                        break;
                   }
                }
                
                setEstimate(prev => prev ? { ...prev, approvedOn: approvalDate } : null);
                setIsApproving(false);
            }, 700);
        } catch (e) {
            console.error("Failed to approve estimate", e);
            alert('Произошла ошибка при согласовании. Пожалуйста, попробуйте позже.');
            setIsApproving(false);
        }
    };


    if (project === undefined || estimate === undefined) {
        return <Loader fullScreen />;
    }

    if (!project || !estimate) {
        return <div className="loader-overlay"><div style={{color: 'hsl(var(--text-primary))'}}>Смета не найдена или ссылка некорректна.</div></div>;
    }

    const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const discountAmount = estimate.discount
        ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value)
        : 0;
    const total = subtotal - discountAmount;
    
    const totalsByType = {
        work: estimate.items.filter(i => i.type === 'Работа').reduce((sum, item) => sum + item.quantity * item.price, 0),
        material: estimate.items.filter(i => i.type === 'Материал').reduce((sum, item) => sum + item.quantity * item.price, 0),
    };
    
    return (
        <div className="public-estimate-container">
            <header className="public-header">
                <h1>{estimate.name}</h1>
                <button className="btn btn-primary print-button" onClick={() => window.print()}>
                    <PrintIcon />
                    <span>Печать / Сохранить в PDF</span>
                </button>
            </header>
            
            {project.contractor && (project.contractor.companyName || project.contractor.logo) && (
                <div className="card contractor-card">
                    {project.contractor.logo && <img src={project.contractor.logo} alt="Логотип" className="contractor-logo" />}
                    <div className="contractor-info">
                        <strong>{project.contractor.companyName || 'Исполнитель'}</strong>
                        {project.contractor.contactName && <p>{project.contractor.contactName}</p>}
                        {project.contractor.phone && <p>{project.contractor.phone}</p>}
                    </div>
                </div>
            )}

            <div className="card">
                <h2>{project.name}</h2>
                <p className="project-meta">{project.address}</p>
                <p className="project-meta"><strong>Заказчик:</strong> {project.client.name}, {project.client.phone}</p>
            </div>

            <div className="card">
                <h3>Детализация сметы</h3>
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
                                <tr><td colSpan={5} style={{textAlign: 'center', padding: '1rem'}}>Позиций нет.</td></tr>
                            ) : (
                                estimate.items.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                            <br />
                                            <small>{item.type}</small>
                                        </td>
                                        <td className="align-right">{item.quantity} {item.unit}</td>
                                        <td className="align-right">{formatCurrency(item.price)}</td>
                                        <td className="align-right">{formatCurrency(item.quantity * item.price)}</td>
                                        <td className="align-right">
                                            <button className="action-btn comment-btn" onClick={() => openCommentModal(item)} aria-label="Комментарии">
                                                <CommentIcon />
                                                {(item.comments?.length || 0) > 0 && <span className="comment-badge">{item.comments?.length}</span>}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                 <h3>Итоги</h3>
                 <div className="estimate-totals">
                     <div className="total-row">
                         <span>Работы</span>
                         <span>{formatCurrency(totalsByType.work)}</span>
                     </div>
                     <div className="total-row">
                         <span>Материалы</span>
                         <span>{formatCurrency(totalsByType.material)}</span>
                     </div>
                      <div className="total-row">
                         <span>Подытог</span>
                         <span>{formatCurrency(subtotal)}</span>
                     </div>
                     {discountAmount > 0 && estimate.discount && (
                         <div className="total-row discount-row">
                             <span>Скидка ({estimate.discount.type === 'percent' ? `${estimate.discount.value}%` : formatCurrency(estimate.discount.value)})</span>
                             <span>- {formatCurrency(discountAmount)}</span>
                         </div>
                     )}
                     <div className="total-row grand-total">
                         <span>Всего по смете</span>
                         <span>{formatCurrency(total)}</span>
                     </div>
                 </div>
            </div>
            
            {(project.schedule && project.schedule.length > 0) && (
                <div className="card">
                    <h3>График работ</h3>
                    <div className="data-list">
                         {project.schedule.map(item => (
                            <div key={item.id} className="data-item">
                                <div className="data-item-info">
                                    <strong>{item.name}</strong>
                                    <span className="data-item-subtext">
                                        {new Date(item.startDate).toLocaleDateString()} - {item.endDate ? new Date(item.endDate).toLocaleDateString() : '...'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {(project.documents && project.documents.length > 0) && (
                <div className="card">
                    <h3>Документы</h3>
                    <div className="data-list">
                         {project.documents.map(doc => (
                            <div key={doc.id} className="data-item">
                                <div className="data-item-info">
                                    <a href={doc.file} download={doc.fileName}>{doc.name}</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {(project.photoReports && project.photoReports.length > 0) && (
                <div className="card">
                    <h3>Фотоотчет о ходе работ</h3>
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

             <div className="card approval-section">
                {estimate.approvedOn ? (
                    <div className="approval-status approved">
                        <CheckIcon />
                        <div>
                            <strong>Смета согласована</strong>
                            <p>Дата: {new Date(estimate.approvedOn).toLocaleDateString('ru-RU')}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <p>Пожалуйста, внимательно проверьте все позиции. Нажимая кнопку "Согласовать", вы подтверждаете свое согласие с объемом работ и их стоимостью.</p>
                        <button className="btn btn-primary btn-large" onClick={handleApprove} disabled={isApproving}>
                            {isApproving ? <Loader/> : 'Согласовать смету'}
                        </button>
                    </>
                )}
            </div>

            <footer className="public-footer">
                <p>Смета сформирована в <a href={window.location.origin} target="_blank" rel="noopener noreferrer">Прораб</a></p>
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

interface AuthScreenProps {
    onLoginSuccess: (user: User) => void;
}
const AuthScreen = ({ onLoginSuccess }: AuthScreenProps) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToasts();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const user = await api.login(email, password);
                addToast('Вход выполнен успешно!', 'success');
                onLoginSuccess(user);
            } else {
                if(password.length < 6) {
                    throw new Error('Пароль должен быть не менее 6 символов.');
                }
                const newUser = await api.register(email, password);
                addToast('Аккаунт успешно создан!', 'success');
                onLoginSuccess(newUser);
            }
        } catch (err: any) {
            setError(err.message || 'Произошла ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="auth-container">
            <div className="auth-card animate-fade-slide-up">
                <div className="auth-header">
                    <h1>Прораб</h1>
                    <p>{isLogin ? 'Войдите, чтобы продолжить' : 'Создайте аккаунт для начала работы'}</p>
                </div>

                <div className="modal-toggle" style={{ marginBottom: 'var(--space-6)' }}>
                    <button className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setError('') }}>Вход</button>
                    <button className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setError('') }}>Регистрация</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {error && <p className="auth-error">{error}</p>}
                    <div className="form-group">
                        <label htmlFor="auth-email">Email</label>
                        <div className="form-group-icon">
                            <EmailIcon />
                            <input id="auth-email" type="email" placeholder="email@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required disabled={isLoading}/>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="auth-password">Пароль</label>
                        <div className="form-group-icon">
                            <LockIcon />
                            <input id="auth-password" type="password" placeholder="••••••••" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required disabled={isLoading}/>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
                        {isLoading ? <Loader /> : (isLogin ? 'Войти' : 'Создать аккаунт')}
                    </button>
                </form>
            </div>
        </main>
    );
};

interface ReportsViewProps {
    projects: Project[];
    onBack: () => void;
}
const ReportsView = ({ projects, onBack }: ReportsViewProps) => {
    const { addToast } = useToasts();
    
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const getFirstDayOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);

    const [startDate, setStartDate] = useState<string>(getFirstDayOfYear(new Date()).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

    const filteredProjects = useMemo(() => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // include the whole end day
        
        return projects.filter(p => {
             // We consider a project to be in the period if it was completed within the period.
            const completedDate = p.completedAt ? new Date(p.completedAt).getTime() : 0;
            return p.status === 'Завершен' && completedDate >= start && completedDate <= end;
        });
    }, [projects, startDate, endDate]);

    const stats = useMemo(() => {
        let totalRevenue = 0;
        let totalExpenses = 0;
        
        const projectBreakdown = filteredProjects.map(project => {
            const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
                const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                return projectSum + (subtotal - discountAmount);
            }, 0);

            const workTotal = project.estimates.flatMap(e => e.items)
                .filter(item => item.type === 'Работа')
                .reduce((sum, item) => sum + item.quantity * item.price, 0);

            const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
            
            const profit = workTotal - expensesTotal;

            totalRevenue += estimateTotal;
            totalExpenses += expensesTotal;
            
            return {
                id: project.id,
                name: project.name,
                revenue: estimateTotal,
                expenses: expensesTotal,
                profit: profit
            };
        }).sort((a,b) => b.profit - a.profit);
        
        const totalProfit = projectBreakdown.reduce((sum, p) => sum + p.profit, 0);
        const averageRevenue = filteredProjects.length > 0 ? totalRevenue / filteredProjects.length : 0;
        const averageProfit = filteredProjects.length > 0 ? totalProfit / filteredProjects.length : 0;

        return { totalRevenue, totalExpenses, totalProfit, averageRevenue, averageProfit, projectBreakdown };
    }, [filteredProjects, startDate, endDate]);

    const setDateRange = (range: 'this_month' | 'last_month' | 'this_year') => {
        const today = new Date();
        let start, end;

        switch(range) {
            case 'this_month':
                start = getFirstDayOfMonth(today);
                end = today;
                break;
            case 'last_month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                start = getFirstDayOfMonth(lastMonth);
                end = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'this_year':
                start = getFirstDayOfYear(today);
                end = today;
                break;
        }
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleExportCsv = () => {
        try {
            const headers = ['Название проекта', 'Клиент', 'Статус', 'Сумма смет', 'Расходы', 'Оплачено', 'Прибыль'];
            
            const rows = filteredProjects.map(project => {
                const estimateTotal = project.estimates.reduce((projectSum, estimate) => {
                    const subtotal = estimate.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                    const discountAmount = estimate.discount ? (estimate.discount.type === 'percent' ? subtotal * (estimate.discount.value / 100) : estimate.discount.value) : 0;
                    return projectSum + (subtotal - discountAmount);
                }, 0);

                 const workTotal = project.estimates.flatMap(e => e.items)
                    .filter(item => item.type === 'Работа')
                    .reduce((sum, item) => sum + item.quantity * item.price, 0);

                const expensesTotal = project.expenses.reduce((sum, expense) => sum + expense.amount, 0);
                const totalPaid = project.payments.reduce((sum, payment) => sum + payment.amount, 0);
                const profit = workTotal - expensesTotal;
                
                const sanitize = (val: string) => `"${val.replace(/"/g, '""')}"`;

                return [
                    sanitize(project.name),
                    sanitize(project.client.name),
                    sanitize(project.status),
                    estimateTotal.toFixed(2),
                    expensesTotal.toFixed(2),
                    totalPaid.toFixed(2),
                    profit.toFixed(2)
                ];
            });

            const csvRows = [headers.join(';'), ...rows.map(row => row.join(';'))];
            const csvString = csvRows.join('\n');
            const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `prorab_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addToast('Отчет успешно скачан', 'success');
        } catch (error) {
            console.error('CSV Export Error:', error);
            addToast('Не удалось скачать отчет', 'error');
        }
    };

    return (
        <div className="animate-fade-slide-up">
             <button onClick={onBack} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                <span>К проектам</span>
            </button>
            <div className="reports-header">
                <h2>Сводный отчет</h2>
                <button className="btn btn-primary" onClick={handleExportCsv} disabled={filteredProjects.length === 0}>
                    Скачать отчет (CSV)
                </button>
            </div>

            <div className="card date-filter-container">
                <div className="form-group">
                    <label>Период (по дате завершения)</label>
                    <div className="d-flex" style={{gap: 'var(--space-4)', alignItems: 'center'}}>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span>&mdash;</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="d-flex" style={{gap: 'var(--space-3)', flexWrap: 'wrap'}}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDateRange('this_month')}>Этот месяц</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDateRange('last_month')}>Прошлый месяц</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setDateRange('this_year')}>Этот год</button>
                </div>
            </div>

            <div className="reports-grid">
                <div className="report-card">
                    <div className="report-card-label">Общая выручка</div>
                    <div className="report-card-value">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Общие расходы</div>
                    <div className="report-card-value">{formatCurrency(stats.totalExpenses)}</div>
                </div>
                <div className="report-card">
                    <div className="report-card-label">Итоговая прибыль</div>
                    <div className={`report-card-value ${stats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(stats.totalProfit)}
                    </div>
                </div>
            </div>
             <div className="reports-grid small">
                <div className="report-card small">
                    <div className="report-card-label">Завершено проектов</div>
                    <div className="report-card-value">{filteredProjects.length}</div>
                </div>
                <div className="report-card small">
                    <div className="report-card-label">Средний чек</div>
                    <div className="report-card-value">{formatCurrency(stats.averageRevenue)}</div>
                </div>
                <div className="report-card small">
                    <div className="report-card-label">Средняя прибыль</div>
                    <div className={`report-card-value ${stats.averageProfit >= 0 ? 'profit' : 'loss'}`}>
                        {formatCurrency(stats.averageProfit)}
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Прибыльность по проектам</h3>
                {stats.projectBreakdown.length === 0 ? (
                    <div className="empty-state" style={{padding: 'var(--space-6)'}}>
                        <p>Нет завершенных проектов за выбранный период.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="profit-table">
                            <thead>
                                <tr>
                                    <th>Проект</th>
                                    <th className="align-right">Выручка</th>
                                    <th className="align-right">Расходы</th>
                                    <th className="align-right">Прибыль</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.projectBreakdown.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td className="align-right">{formatCurrency(p.revenue)}</td>
                                        <td className="align-right">{formatCurrency(p.expenses)}</td>
                                        <td className={`align-right ${p.profit >= 0 ? 'profit' : 'loss'}`}>{formatCurrency(p.profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

interface DirectoryEditModalProps {
    show: boolean;
    onClose: () => void;
    item: DirectoryItem;
    onSave: (item: DirectoryItem) => Promise<void>;
}
const DirectoryEditModal = ({ show, onClose, item, onSave }: DirectoryEditModalProps) => {
    const [editedItem, setEditedItem] = useState<DirectoryItem>(item);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setEditedItem(item);
        }
    }, [item, show]);

    const handleFormSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(editedItem);
        setIsSaving(false);
        onClose();
    };

    if (!item) return null;

    return (
        <Modal show={show} onClose={onClose} title="Редактировать справочник">
            <form onSubmit={handleFormSave}>
                <div className="form-group">
                    <label>Наименование</label>
                    <input type="text" value={editedItem.name} onChange={e => setEditedItem({...editedItem, name: e.target.value})} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Тип</label>
                    <select value={editedItem.type} onChange={e => setEditedItem({...editedItem, type: e.target.value as 'Работа' | 'Материал'})} disabled={isSaving}>
                        <option>Работа</option>
                        <option>Материал</option>
                    </select>
                </div>
                 <div className="form-group">
                   <label>Ед. изм.</label>
                   <input type="text" value={editedItem.unit} onChange={e => setEditedItem({...editedItem, unit: e.target.value})} required disabled={isSaving}/>
                </div>
                <div className="form-group">
                    <label>Цена</label>
                    <input type="number" step="0.01" value={editedItem.price} onChange={e => setEditedItem({...editedItem, price: parseFloat(e.target.value) || 0})} required disabled={isSaving}/>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Отмена</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? <Loader/> : 'Сохранить'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

interface DirectoryViewProps {
    directory: DirectoryItem[];
    setDirectory: React.Dispatch<React.SetStateAction<DirectoryItem[]>>;
    userKey: string;
    onBack: () => void;
}
const DirectoryView = ({ directory, setDirectory, userKey, onBack }: DirectoryViewProps) => {
    const [editingItem, setEditingItem] = useState<DirectoryItem | null>(null);
    const { addToast } = useToasts();

    const handleEdit = (item: DirectoryItem) => {
        setEditingItem(item);
    };

    const handleDelete = async (itemId: string) => {
        if (window.confirm('Вы уверены, что хотите удалить эту запись из справочника?')) {
            try {
                const updatedDirectory = directory.filter(item => item.id !== itemId);
                setDirectory(updatedDirectory);
                await api.saveData(userKey, 'directory', updatedDirectory);
                addToast('Запись удалена', 'success');
            } catch (e) {
                addToast('Не удалось удалить запись', 'error');
            }
        }
    };

    const handleSave = async (updatedItem: DirectoryItem) => {
        try {
            const updatedDirectory = directory.map(item => item.id === updatedItem.id ? updatedItem : item);
            setDirectory(updatedDirectory);
            await api.saveData(userKey, 'directory', updatedDirectory);
            addToast('Запись обновлена', 'success');
        } catch (e) {
            addToast('Не удалось обновить запись', 'error');
        }
    };

    return (
        <div className="animate-fade-slide-up">
             <button onClick={onBack} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                <span>К проектам</span>
            </button>
            <div className="card">
                <div className="d-flex justify-between align-center mb-1">
                    <h2>Справочник</h2>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Тип</th>
                                <th className="align-right">Цена</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {directory.length === 0 ? (
                                <tr><td colSpan={4} style={{textAlign: 'center', padding: '1rem'}}>Справочник пуст.</td></tr>
                            ) : (
                                [...directory]
                                    .sort((a,b) => a.name.localeCompare(b.name))
                                    .map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.name}</strong>
                                            <br/>
                                            <small>{item.unit}</small>
                                        </td>
                                        <td>{item.type}</td>
                                        <td className="align-right">{formatCurrency(item.price)}</td>
                                        <td className="align-right">
                                            <div className="item-actions">
                                                <button className="action-btn" onClick={() => handleEdit(item)} aria-label="Редактировать"><EditIcon /></button>
                                                <button className="action-btn" onClick={() => handleDelete(item.id)} aria-label="Удалить"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editingItem && (
                <DirectoryEditModal 
                    show={!!editingItem}
                    onClose={() => setEditingItem(null)}
                    item={editingItem}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

interface InventoryViewProps {
    inventory: InventoryItem[];
    setInventory: Dispatch<SetStateAction<InventoryItem[]>>;
    projects: Project[];
    userKey: string;
    onBack: () => void;
    inventoryNotes: ProjectNote[];
    setInventoryNotes: Dispatch<SetStateAction<ProjectNote[]>>;
}
const InventoryView = ({ inventory, setInventory, projects, userKey, onBack, inventoryNotes, setInventoryNotes }: InventoryViewProps) => {
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({ name: '', location: 'На базе' });
    const { addToast } = useToasts();
    
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        let updatedInventory;
        if (editingItem) {
            updatedInventory = inventory.map(item => item.id === editingItem.id ? { ...item, ...newItem } : item);
        } else {
            updatedInventory = [...inventory, { ...newItem, id: generateId() }];
        }
        setInventory(updatedInventory);
        await api.saveData(userKey, 'inventory', updatedInventory);
        setShowModal(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Удалить этот инструмент из списка?')) {
            const updatedInventory = inventory.filter(item => item.id !== id);
            setInventory(updatedInventory);
            await api.saveData(userKey, 'inventory', updatedInventory);
            addToast('Инструмент удален', 'success');
        }
    };

    const openModalForNew = () => {
        setEditingItem(null);
        setNewItem({ name: '', location: 'На базе' });
        setShowModal(true);
    };

    const openModalForEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setNewItem({ ...item });
        setShowModal(true);
    };

    const handleNotesUpdate = async (notes: ProjectNote[]) => {
        setInventoryNotes(notes);
        await api.saveData(userKey, 'inventory_notes', notes);
    };

    return (
        <div className="animate-fade-slide-up">
            <button onClick={onBack} className="back-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor"/></svg>
                <span>К проектам</span>
            </button>
            <div className="card">
                <div className="d-flex justify-between align-center mb-1">
                    <h2>Инвентарь</h2>
                    <button className="btn btn-primary" onClick={openModalForNew}>+ Добавить</button>
                </div>
                {inventory.length === 0 ? (
                    <div className="empty-state">
                        <p>Ваш список инструмента пуст.</p>
                    </div>
                ) : (
                    <div className="data-list">
                        {inventory.map(item => (
                            <div key={item.id} className="data-item">
                                <div className="data-item-info">
                                    <strong>{item.name}</strong>
                                    <span className="data-item-subtext">
                                        {item.location === 'На базе' ? 'На базе' : `Объект: ${projectMap.get(item.location) || 'Неизвестно'}`}
                                    </span>
                                </div>
                                <div className="item-actions">
                                    <button className="action-btn" onClick={() => openModalForEdit(item)}><EditIcon /></button>
                                    <button className="action-btn" onClick={() => handleDelete(item.id)}><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <NotesComponent title="Заметки по инвентарю" notes={inventoryNotes} onUpdate={handleNotesUpdate} />
            <Modal show={showModal} onClose={() => setShowModal(false)} title={editingItem ? 'Редактировать' : 'Новый инструмент'}>
                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label>Название</label>
                        <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required/>
                    </div>
                    <div className="form-group">
                        <label>Местоположение</label>
                        <select value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})}>
                            <option value="На базе">На базе</option>
                            {projects.filter(p => p.status === 'В работе').map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Отмена</button>
                        <button type="submit" className="btn btn-primary">Сохранить</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

interface AppContentProps {
    currentUser: User;
    onLogout: () => void;
}
const AppContent = ({ currentUser, onLogout }: AppContentProps) => {
    const userKey = currentUser.email;
    const [projects, setProjects] = useState<Project[]>([]);
    const [directory, setDirectory] = useState<DirectoryItem[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile>({ companyName: '', contactName: userKey, phone: '', logo: '' });
    const [templates, setTemplates] = useState<EstimateTemplate[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [inventoryNotes, setInventoryNotes] = useState<ProjectNote[]>([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'projects' | 'reports' | 'directory' | 'inventory'>('projects');
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const { addToast } = useToasts();

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const { projects, directory, profile, templates, inventory, inventoryNotes } = await api.getData(userKey);
                setProjects(projects);
                setDirectory(directory);
                setUserProfile(profile);
                setTemplates(templates);
                setInventory(inventory);
                setInventoryNotes(inventoryNotes);
            } catch (e) {
                addToast('Не удалось загрузить данные', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, [userKey, addToast]);
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId) || null;
    }, [projects, selectedProjectId]);
    
    const handleSelectProject = (id: string) => setSelectedProjectId(id);
    const handleBackToProjects = () => {
        setSelectedProjectId(null);
        setCurrentView('projects');
    };
    const handleViewChange = (view: 'projects' | 'reports' | 'directory' | 'inventory') => {
        setCurrentView(view);
        setSelectedProjectId(null); // Reset project selection when switching views
    };

    if (isLoading) {
        return <Loader fullScreen />;
    }

    return (
        <>
            <header>
                <div className="header-content">
                    <h1 onClick={() => handleViewChange('projects')} style={{cursor: 'pointer'}} aria-label="На главную">Прораб</h1>
                    <div className="header-actions">
                         <button className="settings-btn" onClick={() => handleViewChange('inventory')} aria-label="Инвентарь">
                            <ToolIcon />
                        </button>
                        <button className="settings-btn" onClick={() => handleViewChange('directory')} aria-label="Справочник">
                            <DirectoryIcon />
                        </button>
                        <button className="settings-btn" onClick={() => handleViewChange('reports')} aria-label="Отчеты">
                            <ReportsIcon />
                        </button>
                        <button className="settings-btn" onClick={() => setShowProfileModal(true)} aria-label="Настройки профиля">
                            <SettingsIcon />
                        </button>
                        <button className="settings-btn" onClick={onLogout} aria-label="Выход">
                            <LogoutIcon />
                        </button>
                    </div>
                </div>
            </header>
            <main className="app-container">
                 {currentView === 'projects' ? (
                     selectedProject ? (
                        <ProjectDetails 
                            project={selectedProject} 
                            projects={projects}
                            setProjects={setProjects} 
                            onBack={handleBackToProjects}
                            directory={directory}
                            setDirectory={setDirectory}
                            templates={templates}
                            setTemplates={setTemplates}
                            userKey={userKey}
                        />
                    ) : (
                        <ProjectList 
                            projects={projects} 
                            onSelectProject={handleSelectProject}
                            onNewProject={() => setShowNewProjectModal(true)}
                        />
                    )
                 ) : currentView === 'reports' ? (
                    <ReportsView projects={projects} onBack={() => handleViewChange('projects')} />
                 ) : currentView === 'directory' ? (
                    <DirectoryView
                        directory={directory}
                        setDirectory={setDirectory}
                        userKey={userKey}
                        onBack={() => handleViewChange('projects')}
                    />
                 ) : (
                    <InventoryView
                        inventory={inventory}
                        setInventory={setInventory}
                        projects={projects}
                        userKey={userKey}
                        onBack={() => handleViewChange('projects')}
                        inventoryNotes={inventoryNotes}
                        setInventoryNotes={setInventoryNotes}
                     />
                 )}
            </main>

            <nav className="bottom-nav">
                <button
                    className={`bottom-nav-btn ${currentView === 'projects' ? 'active' : ''}`}
                    onClick={() => handleViewChange('projects')}
                    aria-label="Проекты"
                >
                    <ProjectsIcon />
                    <span>Проекты</span>
                </button>
                 <button
                    className={`bottom-nav-btn ${currentView === 'inventory' ? 'active' : ''}`}
                    onClick={() => handleViewChange('inventory')}
                    aria-label="Инвентарь"
                >
                    <ToolIcon />
                    <span>Инвентарь</span>
                </button>
                <button
                    className={`bottom-nav-btn ${currentView === 'directory' ? 'active' : ''}`}
                    onClick={() => handleViewChange('directory')}
                    aria-label="Справочник"
                >
                    <DirectoryIcon />
                    <span>Справочник</span>
                </button>
                <button
                    className={`bottom-nav-btn ${currentView === 'reports' ? 'active' : ''}`}
                    onClick={() => handleViewChange('reports')}
                    aria-label="Отчеты"
                >
                    <ReportsIcon />
                    <span>Отчеты</span>
                </button>
            </nav>

            <ProjectCreationModal 
                show={showNewProjectModal} 
                onClose={() => setShowNewProjectModal(false)} 
                projects={projects}
                setProjects={setProjects}
                userProfile={userProfile}
                templates={templates}
                userKey={userKey}
            />
            <ProfileModal
                show={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                profile={userProfile}
                setProfile={setUserProfile}
                userKey={userKey}
            />
        </>
    );
}

const App = () => {
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('prorab_currentUser', null);
    
    // --- Routing Logic ---
    const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const view = urlParams.get('view');

    const AppWrapper = (
        <ToastProvider>
            {(() => {
                if (view === 'estimate') {
                    return <PublicEstimateView />;
                }

                const handleLoginSuccess = (user: User) => {
                    setCurrentUser({email: user.email}); // Store only non-sensitive data
                };

                const handleLogout = () => {
                    if(window.confirm('Вы уверены, что хотите выйти?')) {
                        setCurrentUser(null);
                    }
                };

                if (!currentUser) {
                    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
                }
                
                return <AppContent currentUser={currentUser} onLogout={handleLogout} />;
            })()}
        </ToastProvider>
    );

    return AppWrapper;
};

// This is the robust way to initialize the React app.
const renderApp = () => {
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        root.render(<App />);
    } else {
        console.error('Fatal Error: Root container #root not found in the document.');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}