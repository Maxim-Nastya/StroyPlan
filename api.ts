import type { User, Project, DirectoryItem, UserProfile, EstimateTemplate, InventoryItem, ProjectNote, Estimate, EstimateItem, Comment } from './types';
import { generateId } from './utils';

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
export const api = {
    async login(email: string, password: string): Promise<User> {
        await _delay();
        const users = _get<User[]>('prorab_users', []);
        const user = users.find(u => u.email === email);
        if (user && user.password === password) {
            return user;
        }
        throw new Error('Неверный email или пароль.');
    },

    async register(email: string, password: string): Promise<User> {
        await _delay(700);
        const users = _get<User[]>('prorab_users', []);
        if (users.some(u => u.email === email)) {
            throw new Error('Пользователь с таким email уже существует.');
        }
        const newUser: User = { 
            email, 
            password,
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
        _set('prorab_users', [...users, newUser]);
        return newUser;
    },

    async getData(userKey: string): Promise<{ user: User, projects: Project[], directory: DirectoryItem[], profile: UserProfile, templates: EstimateTemplate[], inventory: InventoryItem[], inventoryNotes: ProjectNote[] }> {
        await _delay(800);

        const users = _get<User[]>('prorab_users', []);
        const user = users.find(u => u.email === userKey) as User;

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

        return { user, projects, directory, profile, templates, inventory, inventoryNotes };
    },

    async saveProjects(userKey: string, data: Project[]): Promise<void> {
        await _delay();
        const key = `prorab_projects_${userKey}`;
        _set(key, data);
    
        // If projects are updated, we must also update the aggregated 'all_projects' key
        // to ensure share links work immediately with the latest data.
        const otherProjectKeys = Object.keys(localStorage)
            .filter(k => k.startsWith('prorab_projects_') && k !== key && k !== 'prorab_projects_all');
        
        let combinedProjects = [...data];
        for (const otherKey of otherProjectKeys) {
            combinedProjects = [...combinedProjects, ..._get<Project[]>(otherKey, [])];
        }
         // Deduplicate in case of any overlap
        const uniqueProjects = Array.from(new Map(combinedProjects.map(p => [p.id, p])).values());
        _set('prorab_projects_all', uniqueProjects);
    },

    async saveDirectory(userKey: string, data: DirectoryItem[]): Promise<void> {
        await _delay();
        _set(`prorab_directory_${userKey}`, data);
    },

    async saveProfile(userKey: string, data: UserProfile): Promise<void> {
        await _delay();
        _set(`prorab_profile_${userKey}`, data);
    },

    async saveTemplates(userKey: string, data: EstimateTemplate[]): Promise<void> {
        await _delay();
        _set(`prorab_templates_${userKey}`, data);
    },

    async saveInventory(userKey: string, data: InventoryItem[]): Promise<void> {
        await _delay();
        _set(`prorab_inventory_${userKey}`, data);
    },
    
    async saveInventoryNotes(userKey: string, data: ProjectNote[]): Promise<void> {
        await _delay();
        _set(`prorab_inventory_notes_${userKey}`, data);
    },
    
    async activateSubscription(userKey: string): Promise<User> {
        await _delay(1000);
        const users = _get<User[]>('prorab_users', []);
        let updatedUser: User | null = null;
        const updatedUsers = users.map(u => {
            if (u.email === userKey) {
                // If current subscription is expired, start new one from today.
                // Otherwise, extend the existing one.
                const now = new Date();
                const currentSubEnd = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt) : now;
                const startDate = currentSubEnd > now ? currentSubEnd : now;

                updatedUser = { 
                    ...u, 
                    subscriptionEndsAt: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() 
                };
                return updatedUser;
            }
            return u;
        });
        _set('prorab_users', updatedUsers);
        if (updatedUser) {
            return updatedUser;
        }
        throw new Error('Пользователь не найден');
    }
};