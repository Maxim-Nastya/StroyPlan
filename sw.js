const CACHE_NAME = 'prorab-cache-v3.0';
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './index.tsx', // Keep for reference, but app will load index.js
  './logo.svg',
  './manifest.json',
  './icons/icon.svg',
  './icons/prorab-192.png',
  './icons/prorab-512.png',
  './icons/prorab-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://esm.sh/react@18.3.1',
  'https://esm.sh/react-dom@18.3.1/client',
  'https://esm.sh/@google/genai'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim())
  );
});

// --- MOCK API SERVER ---

const getUserKeyFromToken = (token) => {
    if (!token || !token.startsWith('Bearer mock-token-')) return null;
    return token.substring('Bearer mock-token-'.length);
};

const get = (key, defaultValue) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
const set = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// Helper to respond with JSON
const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

const handleApiFetch = async (event) => {
    const { request } = event;
    const { pathname, searchParams } = new URL(request.url);
    
    // --- PUBLIC ROUTES ---
    if (request.method === 'POST' && pathname === '/api/auth/register') {
        const { email, password } = await request.json();
        const users = get('prorab_users', []);
        if (users.some(u => u.email === email)) {
            return jsonResponse({ message: 'Пользователь с таким email уже существует.' }, 409);
        }
        const newUser = { 
            email, 
            password, // In a real app, this would be hashed
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
        set('prorab_users', [...users, newUser]);
        const token = `mock-token-${email}`;
        return jsonResponse({ user: newUser, token }, 201);
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
        const { email, password } = await request.json();
        const users = get('prorab_users', []);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const token = `mock-token-${email}`;
            return jsonResponse({ user, token });
        }
        return jsonResponse({ message: 'Неверный email или пароль.' }, 401);
    }

    if (request.method === 'GET' && pathname === '/api/public/estimate') {
        const projectId = searchParams.get('projectId');
        const estimateId = searchParams.get('estimateId');
        if (!projectId || !estimateId) {
             return jsonResponse({ message: 'Missing projectId or estimateId' }, 400);
        }

        const allProjects = Object.keys(localStorage)
            .filter(k => k.startsWith('prorab_projects_'))
            .flatMap(k => get(k, []));
        
        const project = allProjects.find(p => p.id === projectId);
        if (!project) return jsonResponse({ message: 'Project not found' }, 404);

        const estimate = project.estimates.find(e => e.id === estimateId);
        if (!estimate) return jsonResponse({ message: 'Estimate not found' }, 404);

        // Find the owner's profile to attach contractor info
        const ownerEmail = Object.keys(localStorage)
            .find(key => key.startsWith('prorab_projects_') && get(key, []).some(p => p.id === projectId))
            ?.replace('prorab_projects_', '');

        const profile = ownerEmail ? get(`prorab_profile_${ownerEmail}`, null) : null;
        const projectWithContractor = { ...project, contractor: profile };

        return jsonResponse({ project: projectWithContractor, estimate });
    }
     if (request.method === 'POST' && pathname === '/api/public/estimate/approve') {
        const { projectId, estimateId } = await request.json();
        
        const ownerKey = Object.keys(localStorage).find(k => k.startsWith('prorab_projects_') && get(k, []).some(p => p.id === projectId));
        if (!ownerKey) return jsonResponse({ message: "Project owner not found" }, 404);

        const projects = get(ownerKey, []);
        const updatedProjects = projects.map(p => {
             if (p.id === projectId) {
                const updatedEstimates = p.estimates.map(e => e.id === estimateId ? {...e, approvedOn: new Date().toISOString()} : e);
                return {...p, estimates: updatedEstimates};
            }
            return p;
        });
        set(ownerKey, updatedProjects);
        return jsonResponse({ success: true });
    }

    // --- PROTECTED ROUTES ---
    const authHeader = request.headers.get('Authorization');
    const userKey = getUserKeyFromToken(authHeader);

    if (!userKey) {
        return jsonResponse({ message: 'Unauthorized' }, 401);
    }
    
    // --- GET DATA (Granular) ---
    const getData = (dataType) => {
        const data = get(`prorab_${dataType}_${userKey}`, []);
        return jsonResponse(data);
    };

    if (request.method === 'GET') {
        if (pathname === '/api/user') {
            const users = get('prorab_users', []);
            const currentUser = users.find(u => u.email === userKey);
            return jsonResponse(currentUser);
        }
        if (pathname === '/api/projects') return getData('projects');
        if (pathname === '/api/directory') return getData('directory');
        if (pathname === '/api/profile') return jsonResponse(get(`prorab_profile_${userKey}`, { companyName: '', contactName: userKey, phone: '', logo: '' }));
        if (pathname === '/api/templates') return getData('templates');
        if (pathname === '/api/inventory') return getData('inventory');
        if (pathname === '/api/inventory-notes') return getData('inventory_notes');
    }
    
    // --- SAVE DATA ---
    const saveData = async (dataType) => {
        const data = await request.json();
        set(`prorab_${dataType}_${userKey}`, data);
        return jsonResponse({ success: true });
    };

    if (request.method === 'POST') {
        if (pathname === '/api/projects') return saveData('projects');
        if (pathname === '/api/directory') return saveData('directory');
        if (pathname === '/api/profile') return saveData('profile');
        if (pathname === '/api/templates') return saveData('templates');
        if (pathname === '/api/inventory') return saveData('inventory');
        if (pathname === '/api/inventory-notes') return saveData('inventory_notes');
    }

    if (request.method === 'POST' && pathname === '/api/subscription/activate') {
        const users = get('prorab_users', []);
        let updatedUser = null;
        const updatedUsers = users.map(u => {
            if (u.email === userKey) {
                const now = new Date();
                const currentSubEnd = u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt) : now;
                const startDate = currentSubEnd > now ? currentSubEnd : now;
                updatedUser = { ...u, subscriptionEndsAt: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() };
                return updatedUser;
            }
            return u;
        });
        set('prorab_users', updatedUsers);
        return jsonResponse(updatedUser);
    }

    // Fallback for any unhandled API routes
    return jsonResponse({ message: 'Not Found' }, 404);
};


self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // If it's an API call, handle it with the mock server
    if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiFetch(event));
        return;
    }

    // For non-API calls, use a cache-first strategy
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                // Cache valid responses
                if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return fetchResponse;
            });
        })
    );
});
