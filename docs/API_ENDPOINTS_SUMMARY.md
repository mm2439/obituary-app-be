# 📋 API Endpoints Summary

Complete reference of all available API endpoints in the Obituary App Backend.

## 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/user` | Register new user | ❌ |
| POST | `/api/auth/login` | User login | ❌ |
| POST | `/api/auth/logout` | User logout | ✅ |

## 👤 User Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/me` | Get current user profile | ✅ |
| PATCH | `/api/user/me` | Update user profile | ✅ |

## ⚰️ Obituary Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/obituary` | Get public obituaries | ❌ |
| POST | `/api/obituary` | Create new obituary | ✅ |
| PATCH | `/api/obituary/:id` | Update obituary | ✅ |
| GET | `/api/obituary/funerals` | Get funerals list | ❌ |
| GET | `/api/obituary/memory` | Get memory page | ❌ |
| GET | `/api/obituary/memories` | Get user memories | ✅ |
| GET | `/api/obituary/company` | Get company obituaries | ✅ |
| GET | `/api/obituary/company/monthly` | Get monthly stats | ✅ |
| PATCH | `/api/obituary/visits/:id` | Update visit count | ❌ |
| GET | `/api/obituary/logs` | Get memory logs | ✅ |
| GET | `/api/obituary/pending-data` | Get pending data | ✅ |
| GET | `/api/obituary/id` | Memory ID navigation | ❌ |

## 🌸 Florist Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/florist_shop` | Get florist shops | ✅ |
| POST | `/api/florist_shop` | Add/Update florist shops | ✅ |
| GET | `/api/florist_shop?city=X` | Get shops by city | ❌ |
| GET | `/api/florist_slide` | Get florist slides | ✅ |
| POST | `/api/florist_slide` | Add florist slides | ✅ |

## 📦 Package Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/package` | Get company packages | ✅ |
| POST | `/api/package` | Add/Update packages | ✅ |
| DELETE | `/api/package/:id` | Delete package | ✅ |
| GET | `/api/package?companyId=X` | Get public packages | ❌ |

## 👑 Admin Endpoints

| Method | Endpoint | Description | Auth Required | Admin Only |
|--------|----------|-------------|---------------|------------|
| GET | `/api/admin/stats` | Dashboard statistics | ✅ | ✅ |
| GET | `/api/admin/users` | Get all users | ✅ | ✅ |
| GET | `/api/admin/users/:id` | Get user details | ✅ | ✅ |
| PATCH | `/api/admin/users/:id/block` | Block/Unblock user | ✅ | ✅ |
| PATCH | `/api/admin/users/:id/role` | Update user role | ✅ | ✅ |
| PATCH | `/api/admin/users/:id/permissions` | Update permissions | ✅ | ✅ |
| GET | `/api/admin/funeral-companies` | Get funeral companies | ✅ | ✅ |
| GET | `/api/admin/florist-companies` | Get florist companies | ✅ | ✅ |
| GET | `/api/admin/obituaries` | Get all obituaries | ✅ | ✅ |

## 🏥 Health & Status Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Health check | ❌ |
| GET | `/api/health` | API health status | ❌ |

## 🔑 Authentication Headers

For protected endpoints, include the authorization header:
```
Authorization: Bearer <access_token>
```

## 📊 Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎯 User Roles & Permissions

### User Roles
- **USER**: Basic user with limited permissions
- **FUNERAL_COMPANY**: Can create and manage obituaries
- **FLORIST**: Can manage florist shops and packages
- **ADMIN**: Full system access
- **SUPERADMIN**: Ultimate system control

### Permission Fields
- `createObituaryPermission`: Can create obituaries
- `assignKeeperPermission`: Can assign memory keepers
- `sendGiftsPermission`: Can send gifts
- `sendMobilePermission`: Can send mobile notifications

## 🧪 Testing Endpoints

Use the comprehensive test suites to validate all endpoints:

```bash
# Test all endpoints
npm run test:all

# Test specific API groups
npm run test:auth          # Authentication
npm run test:user          # User management
npm run test:obituary      # Obituary operations
npm run test:florist       # Florist operations
npm run test:admin         # Admin operations
npm run test:package       # Package management
```

## 🔒 Security Notes

1. **Authentication Required**: Most endpoints require valid JWT tokens
2. **Role-Based Access**: Admin endpoints check user roles
3. **Input Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: Implemented to prevent abuse
5. **CORS Enabled**: Configured for frontend integration

## 📱 Frontend Integration

### Base Configuration
```javascript
const API_BASE_URL = 'https://your-api.netlify.app';

// Include auth token in requests
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

### Example API Call
```javascript
const response = await fetch(`${API_BASE_URL}/api/obituary`, {
  method: 'POST',
  headers,
  body: JSON.stringify(obituaryData)
});

const result = await response.json();
```

## 🚀 Deployment URLs

### Development
- **Local**: `http://localhost:5000`
- **Test**: Use test scripts with local server

### Production
- **Netlify**: `https://your-site.netlify.app`
- **Custom Domain**: Configure in Netlify settings

## 📈 Performance Expectations

- **Response Time**: < 300ms average
- **Concurrent Users**: Scales automatically (serverless)
- **Uptime**: 99.9% (Netlify SLA)
- **Global CDN**: Fast worldwide access

## 🛠️ Development Tools

- **API Testing**: Comprehensive test suites included
- **Documentation**: Auto-generated from code
- **Monitoring**: Built-in health checks
- **Logging**: Structured logging for debugging

---

**📚 For detailed API usage examples, see the individual test files in the `scripts/` directory.**
