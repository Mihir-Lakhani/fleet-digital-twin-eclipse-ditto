# Web UI Dashboard - Quick Reference

## 🚀 Quick Start Commands

```bash
# 1. Start Services
docker-compose -f docker-compose-final.yaml up -d

# 2. Install Dependencies  
pip install -r requirements.txt

# 3. Start Web UI
cd src && python app.py

# 4. Access Dashboard
open http://localhost:5000/dashboard
```

## 📱 Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| **Dashboard** | `/dashboard` | Main overview with stats |
| **Things List** | `/things` | Manage all digital twins |
| **Create Thing** | `/create-thing` | Add new digital twin |
| **Edit Thing** | `/edit-thing/{id}` | Modify existing twin |

## 🔧 File Structure

```
web-ui/
├── static/css/           # Stylesheets
├── static/js/            # JavaScript modules  
├── static/images/        # Static assets
└── templates/            # HTML templates
    └── components/       # Reusable components
```

## 🎨 Key JavaScript Modules

| Module | Purpose | Key Methods |
|--------|---------|-------------|
| **api-client.js** | API communication | `getMongoThings()`, `createMongoThing()` |
| **dashboard.js** | Core UI management | `toggleTheme()`, `showNotification()` |
| **thing-manager.js** | Thing operations | `loadThings()`, `deleteThing()` |
| **thing-form-manager.js** | Form handling | `validateForm()`, `buildThingData()` |
| **websocket-client.js** | Real-time updates | `connect()`, `on()`, `emit()` |

## 🌐 API Endpoints

### Thing Management
```bash
GET    /mongodb/things        # List all things
POST   /mongodb/things        # Create thing
GET    /mongodb/things/{id}   # Get specific thing  
PUT    /mongodb/things/{id}   # Update thing
DELETE /mongodb/things/{id}   # Delete thing
```

### Dashboard
```bash
GET /api/dashboard/stats      # Get dashboard statistics
GET /events                   # Server-Sent Events stream
```

## ⚡ WebSocket Events

### Client → Server
```javascript
socket.emit('subscribe.thing', {thingId: 'vehicle:001'})
socket.emit('request.dashboard.stats')
socket.emit('ping', {timestamp: Date.now()})
```

### Server → Client  
```javascript
socket.on('thing.created', (data) => { /* handle */ })
socket.on('thing.updated', (data) => { /* handle */ })
socket.on('thing.deleted', (data) => { /* handle */ })
socket.on('dashboard.stats', (data) => { /* handle */ })
```

## 🎨 CSS Custom Properties

```css
/* Light Theme */
:root {
  --primary-color: #2563eb;
  --bg-primary: #ffffff;
  --text-primary: #111827;
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
}
```

## 📱 Responsive Breakpoints

| Device | Breakpoint | Layout |
|--------|------------|--------|
| **Mobile** | < 768px | Single column |
| **Tablet** | 768px - 1024px | Adaptive |
| **Desktop** | > 1024px | Full layout |

## 🔧 Thing Data Model

```json
{
  "thingId": "namespace:identifier",
  "attributes": {
    "manufacturer": "Tesla",
    "model": "Model S",
    "location": "Factory"
  },
  "features": {
    "temperature": {
      "properties": {
        "value": 25.5,
        "unit": "celsius"
      }
    }
  }
}
```

## 🛠️ Development Tips

### Debug Mode
```javascript
// Browser console
localStorage.setItem('debug', 'true');
window.location.reload();
```

### Theme Toggle
```javascript
// Switch theme programmatically
window.dashboardManager.toggleTheme();
window.dashboardManager.setTheme('dark');
```

### Custom Notifications
```javascript
// Show custom notification
window.notificationManager.show(
  'Custom message',
  'success',  // success, error, warning, info
  'fas fa-check',  // Font Awesome icon
  5000  // Duration in ms
);
```

### Real-time Updates
```javascript
// Broadcast custom event
window.wsClient.on('custom.event', (data) => {
  console.log('Custom event received:', data);
});
```

## 🚨 Troubleshooting

### WebSocket Issues
```bash
# Check Flask-SocketIO
pip show flask-socketio

# Test WebSocket endpoint
curl -H "Connection: Upgrade" -H "Upgrade: websocket" \
     http://localhost:5000/socket.io/
```

### Static Files Not Loading
```python
# Verify Flask configuration
app = Flask(__name__, 
           template_folder='../web-ui/templates',
           static_folder='../web-ui/static')
```

### Database Connection
```bash
# Test MongoDB connection
python scripts/test_connections.py
```

## 📦 Required Dependencies

```txt
flask==3.1.0
flask-cors==5.0.0
flask-socketio==5.3.6  # For WebSocket support
pymongo==4.15.1
python-dotenv==1.0.1
```

## 🔒 Environment Variables

```bash
# config/.env
DATABASE_URL=mongodb://mongodb:27017/
ECLIPSE_DITTO_API_URL=http://ditto-gateway:8080/api/2
ECLIPSE_DITTO_API_KEY=your-api-key
SECRET_KEY=your-secret-key
APP_PORT=5000
```

## 🎯 Common Tasks

### Add New Thing
1. Go to `/create-thing`
2. Fill basic information
3. Add custom attributes
4. Define features
5. Preview JSON
6. Submit form

### Modify Existing Thing
1. Go to `/things`
2. Click edit button
3. Make changes
4. Save updates

### Monitor Real-time Updates
1. Open multiple browser tabs
2. Create/update/delete things
3. Watch real-time synchronization

### Customize Styling
1. Edit `web-ui/static/css/dashboard.css`
2. Modify CSS custom properties
3. Add component-specific styles

### Extend Functionality
1. Add new routes in `src/app.py`
2. Create JavaScript modules
3. Add corresponding templates
4. Update navigation

---

**🎉 Ready to build amazing digital twin experiences!**

For detailed information, see the complete [Web UI Guide](WEB_UI_GUIDE.md).