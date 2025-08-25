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

const handleApiFetch = async (event) => {
    const { request } = event;
    const { pathname } = new URL(request.url);
    
    // --- AUTH ---
    if (request.method === 'POST' && pathname === '/api/auth/register') {
        const { email, password } = await request.json();
        const users = get('prorab_users', []);
        if (users.some(u => u.email === email)) {
            return new Response(JSON.stringify({ message: 'Пользователь с таким email уже существует.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
        const newUser = { 
            email, 
            password, // In a real app, this would be hashed
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        };
        set('prorab_users', [...users, newUser]);
        const token = `mock-token-${email}`;
        return new Response(JSON.stringify({ user: newUser, token }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && pathname === '/api/auth/login') {
        const { email, password } = await request.json();
        const users = get('prorab_users', []);
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            const token = `mock-token-${email}`;
            return new Response(JSON.stringify({ user, token }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: 'Неверный email или пароль.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // --- PROTECTED ROUTES ---
    const authHeader = request.headers.get('Authorization');
    const userKey = getUserKeyFromToken(authHeader);

    if (!userKey) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const users = get('prorab_users', []);
    const currentUser = users.find(u => u.email === userKey);

    if (request.method === 'GET' && pathname === '/api/data') {
        const data = {
            user: currentUser,
            projects: get(`prorab_projects_${userKey}`, []),
            directory: get(`prorab_directory_${userKey}`, []),
            profile: get(`prorab_profile_${userKey}`, { companyName: '', contactName: userKey, phone: '', logo: '' }),
            templates: get(`prorab_templates_${userKey}`, []),
            inventory: get(`prorab_inventory_${userKey}`, []),
            inventoryNotes: get(`prorab_inventory_notes_${userKey}`, [])
        };
        // This logic is for the public view and needs to be maintained in the mock
        const allProjects = Object.keys(localStorage).filter(k => k.startsWith('prorab_projects_') && k !== 'prorab_projects_all').flatMap(k => get(k, []));
        set('prorab_projects_all', allProjects);
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }
    
    // --- SAVE DATA ---
    const saveData = async (dataType) => {
        const data = await request.json();
        set(`prorab_${dataType}_${userKey}`, data);
        // Special handling for projects to update the public 'all' key
        if (dataType === 'projects') {
            const otherKeys = Object.keys(localStorage).filter(k => k.startsWith('prorab_projects_') && k !== `prorab_projects_${userKey}` && k !== 'prorab_projects_all');
            let combined = [...data];
            otherKeys.forEach(key => combined.push(...get(key, [])));
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            set('prorab_projects_all', unique);
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
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
        return new Response(JSON.stringify(updatedUser), { headers: { 'Content-Type': 'application/json' } });
    }

    // Fallback for any unhandled API routes
    return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
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