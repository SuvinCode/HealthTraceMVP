import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

// Helper to manage a local mock database
const DB_PATH = path.resolve(process.cwd(), 'db.json');
const getDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
      users: [{ email: 'user@example.com', password: 'password', full_name: 'Default User', role: 'user', onboarding_complete: false }],
      entities: {} 
    }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
};
const saveDb = (db) => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  logLevel: 'info',
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url.startsWith('/api')) return next();

          try {
            const db = getDb();
            const url = new URL(req.url, `http://${req.headers.host}`);
            const [unused, api, type, ...rest] = url.pathname.split('/');

            res.setHeader('Content-Type', 'application/json');

            // Handle Authentication
            if (type === 'auth') {
              const endpoint = rest[0];
              
              if (endpoint === 'me' && req.method === 'GET') {
                const token = req.headers.authorization?.split(' ')[1];
                const user = db.users.find(u => u.email === token);
                if (user) {
                  res.end(JSON.stringify(user));
                } else {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ message: 'Unauthorized' }));
                }
                return;
              }

              if (req.method === 'PATCH' && endpoint === 'me') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
                    const token = req.headers.authorization?.split(' ')[1];
                    const userIndex = db.users.findIndex(u => u.email === token);
                    if (userIndex !== -1) {
                      db.users[userIndex] = { ...db.users[userIndex], ...data };
                      saveDb(db);
                      res.end(JSON.stringify(db.users[userIndex]));
                    } else {
                      res.statusCode = 401;
                      res.end(JSON.stringify({ message: 'Unauthorized' }));
                    }
                  } catch (e) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                  }
                });
                return;
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
                    if (endpoint === 'login') {
                      const user = db.users.find(u => u.email === data.email && u.password === data.password);
                      if (user) {
                        res.end(JSON.stringify({ token: user.email, user }));
                      } else {
                        res.statusCode = 401;
                        res.end(JSON.stringify({ message: 'Invalid credentials' }));
                      }
                    } else if (endpoint === 'register') {
                      if (db.users.find(u => u.email === data.email)) {
                        res.statusCode = 400;
                        res.end(JSON.stringify({ message: 'User already exists' }));
                      } else {
                        const newUser = { ...data, onboarding_complete: false };
                        db.users.push(newUser);
                        saveDb(db);
                        res.end(JSON.stringify({ token: newUser.email, user: newUser }));
                      }
                    }
                  } catch (e) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                  }
                });
                return;
              }

              if (endpoint === 'google') {
                res.writeHead(302, { Location: '/login?token=test123@gmail.com' });
                res.end();
                return;
              }
            }

            // Handle Entities
            if (type === 'entities') {
              const entityName = rest[0];
              const list = db[entityName] || db.entities[entityName] || [];

              if (req.method === 'GET') {
                res.end(JSON.stringify(list));
                return;
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
                    data.id = Math.random().toString(36).substr(2, 9);
                    
                    if (db[entityName] && Array.isArray(db[entityName])) {
                      db[entityName].push(data);
                    } else {
                      db.entities[entityName] = db.entities[entityName] || [];
                      db.entities[entityName].push(data);
                    }
                    
                    saveDb(db);
                    res.end(JSON.stringify(data));
                  } catch (e) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                  }
                });
                return;
              }

              if (req.method === 'PATCH') {
                const id = rest[1];
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                  try {
                    const data = JSON.parse(body);
                    const targetList = db[entityName] || db.entities[entityName] || [];
                    const index = targetList.findIndex(e => e.id == id);
                    if (index !== -1) {
                      targetList[index] = { ...targetList[index], ...data };
                      saveDb(db);
                      res.end(JSON.stringify(targetList[index]));
                    } else {
                      res.statusCode = 404;
                      res.end(JSON.stringify({ message: 'Not found' }));
                    }
                  } catch (e) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ message: 'Invalid JSON' }));
                  }
                });
                return;
              }

              if (req.method === 'DELETE') {
                const id = rest[1];
                const targetList = db[entityName] || db.entities[entityName] || [];
                const index = targetList.findIndex(e => e.id == id);
                if (index !== -1) {
                  targetList.splice(index, 1);
                  saveDb(db);
                  res.statusCode = 204;
                  res.end();
                } else {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ message: 'Not found' }));
                }
                return;
              }
            }
          } catch (error) {
            console.error('Mock API Error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ message: 'Internal Server Error' }));
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    open: true,
    host: 'localhost',
    port: 3000,
  },
});
