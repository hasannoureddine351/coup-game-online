# Authentication Flow - Coup Frontend

This document visualizes the authentication flow and how different components interact in the Coup frontend application.

## Components Overview

- **API Client** (`api/client.ts`) - Handles all HTTP requests with automatic token injection
- **Auth Context** (`contexts/auth-context.tsx`) - Manages auth state and provides auth functions
- **Private Route** (`src/components/auth/PrivateRoute.tsx`) - Protects routes that require authentication
- **Persistent Storage** (`utils/persistentStorage.ts`) - Handles token storage (localStorage/sessionStorage)

---

## Flow 1: User Enters Website URL (Protected Route)

```mermaid
flowchart TD
    A[User enters URL<br/>e.g., /game/123] --> B[React Router loads route]
    B --> C[PrivateRoute component mounts]
    C --> D{Check token in storage<br/>getItem ACCESS_TOKEN}
    
    D -->|No token| E[Set isRedirecting = true]
    E --> F[Navigate to /login]
    F --> G[Render null]
    
    D -->|Token exists| H{Is token expired?<br/>isTokenExpired from Auth Context}
    
    H -->|Not expired| I[Set authCheckComplete = true]
    I --> J[Render protected content<br/>children]
    
    H -->|Token expired| K[Call refreshToken<br/>from Auth Context]
    K --> L[Auth Context calls<br/>API Client POST /auth/refresh]
    L --> M[API Client interceptor<br/>adds JWT header]
    M --> N{Refresh successful?}
    
    N -->|Success| O[Store new token<br/>setItem ACCESS_TOKEN]
    O --> P{Re-check token expiry}
    P -->|Valid| I
    P -->|Still expired| E
    
    N -->|Failed 401/Error| E
    
    style C fill:#e1f5ff
    style H fill:#fff4e1
    style K fill:#ffe1e1
    style J fill:#e1ffe1
```

---

## Flow 2: User Tries to Login

```mermaid
flowchart TD
    A[User fills login form<br/>email + password] --> B[Submit login]
    B --> C[Login component calls<br/>API Client api.post /auth/login]
    
    C --> D[API Client request interceptor]
    D --> E{Check for token<br/>in storage}
    E -->|No token| F[Skip Authorization header<br/>for login endpoint]
    E -->|Has token| G[Add Authorization: JWT token]
    
    F --> H[Send POST request to backend]
    G --> H
    
    H --> I{Backend response}
    
    I -->|Success 200| J[Receive token + user data]
    J --> K[Store token<br/>setItem ACCESS_TOKEN, token]
    K --> L[Update Auth Context:<br/>setCurrentUser user<br/>setIsAuthenticated true<br/>setIsLoggedIn true]
    L --> M[Navigate to /lobby or<br/>original destination]
    
    I -->|Error 401/422| N[Show error message<br/>Invalid credentials]
    
    I -->|Error 500| O[Show error message<br/>Server error]
    
    style C fill:#e1f5ff
    style K fill:#e1ffe1
    style L fill:#e1ffe1
    style N fill:#ffe1e1
```

---

## Flow 3: API Request to Protected Endpoint

```mermaid
flowchart TD
    A[Component needs data<br/>e.g., game list] --> B[Call API Client<br/>api.get /games]
    
    B --> C[API Client request interceptor runs]
    C --> D[Read token from storage<br/>getItem ACCESS_TOKEN]
    
    D --> E{Token exists?}
    E -->|Yes| F[Add header:<br/>Authorization: JWT token]
    E -->|No| G[No Authorization header]
    
    F --> H[Add header:<br/>Content-Type: application/json]
    G --> H
    
    H --> I[Send HTTP request]
    I --> J{Backend response}
    
    J -->|Success 200| K[API Client returns response.data]
    K --> L[Component receives data]
    
    J -->|Error 401 Unauthorized| M[API Client response interceptor]
    M --> N{Current path is /login?}
    N -->|No| O[Redirect to /login<br/>window.location.href]
    N -->|Yes| P[Do not redirect<br/>avoid loop]
    
    J -->|Other error| Q[API Client throws error]
    Q --> R[Component handles error]
    
    style C fill:#e1f5ff
    style F fill:#fff4e1
    style M fill:#ffe1e1
    style L fill:#e1ffe1
```

---

## Flow 4: Token Refresh Process

```mermaid
flowchart TD
    A[Token expired detected] --> B[PrivateRoute or component<br/>calls refreshToken]
    
    B --> C[Auth Context refreshToken function]
    C --> D[Read current token<br/>getItem ACCESS_TOKEN]
    
    D --> E{Token exists?}
    E -->|No| F[Return early<br/>do nothing]
    E -->|Yes| G[Set isRefreshing = true]
    
    G --> H[Call API Client<br/>api.post /auth/refresh, token]
    H --> I[API Client interceptor<br/>adds expired token to header]
    I --> J[Send refresh request]
    
    J --> K{Backend response}
    
    K -->|Success 200| L[Receive new access_token]
    L --> M[Store new token<br/>setItem ACCESS_TOKEN, newToken]
    M --> N[Set isRefreshing = false]
    N --> O[Token refreshed successfully]
    
    K -->|Error 401/403| P[Refresh failed<br/>token invalid]
    P --> Q[Set isRefreshing = false]
    Q --> R[Return/throw error]
    R --> S[Caller handles<br/>redirect to login]
    
    style C fill:#e1f5ff
    style M fill:#e1ffe1
    style P fill:#ffe1e1
```

---

## Flow 5: User Logs Out

```mermaid
flowchart TD
    A[User clicks Logout button] --> B[Call logout from useAuth]
    
    B --> C[Auth Context logout function]
    C --> D[Clear auth state:<br/>setCurrentUser null<br/>setIsAuthenticated false<br/>setIsLoggedIn false]
    
    D --> E[Remove token from storage<br/>removeItem ACCESS_TOKEN]
    E --> F[Remove from persistent storage<br/>storage.removeItem ACCESS_TOKEN<br/>clears localStorage, sessionStorage, cookies]
    
    F --> G[Redirect to login<br/>window.location.href = /login]
    G --> H[User sees login page]
    
    style C fill:#e1f5ff
    style E fill:#fff4e1
    style H fill:#e1ffe1
```

---

## Flow 6: Complete Initial Load to Protected Content

```mermaid
flowchart TD
    A[User opens browser<br/>navigates to /game/123] --> B[App.js renders]
    B --> C[AuthProvider wraps app<br/>initializes auth context]
    
    C --> D[Auth Context state:<br/>isLoading = true<br/>isAuthenticated = false<br/>currentUser = null]
    
    D --> E[React Router matches route<br/>/game/:gameId]
    E --> F[PrivateRoute component mounts<br/>wraps GameRoom component]
    
    F --> G[PrivateRoute useEffect runs]
    G --> H[Read token from storage<br/>getItem ACCESS_TOKEN]
    
    H --> I{Token exists?}
    
    I -->|No token| J[Set isRedirecting = true]
    J --> K[Navigate to /login]
    K --> L[PrivateRoute returns null<br/>unmounts]
    
    I -->|Token exists| M[Call isTokenExpired<br/>from Auth Context]
    M --> N{Token expired?}
    
    N -->|Expired| O[Call refreshToken<br/>see Flow 4]
    O --> P{Refresh success?}
    P -->|Success| Q[Token now valid]
    P -->|Failed| J
    
    N -->|Valid| Q
    Q --> R[Set authCheckComplete = true<br/>setIsValidating = false]
    R --> S[PrivateRoute renders children<br/>GameRoom component]
    
    S --> T[GameRoom makes API calls<br/>using api.get, api.post]
    T --> U[API Client adds JWT header<br/>automatically from storage]
    U --> V[Backend validates token<br/>returns game data]
    V --> W[User sees game interface]
    
    style A fill:#e1e1ff
    style F fill:#e1f5ff
    style S fill:#e1ffe1
    style W fill:#e1ffe1
```

---

## Component Interaction Diagram

```mermaid
graph TB
    subgraph Storage["Persistent Storage"]
        LS[localStorage/sessionStorage<br/>ACCESS_TOKEN]
    end
    
    subgraph Context["Auth Context"]
        AS[Auth State:<br/>currentUser, isAuthenticated,<br/>isLoading, error]
        AF[Auth Functions:<br/>logout, isTokenExpired,<br/>refreshToken]
    end
    
    subgraph API["API Client"]
        RI[Request Interceptor:<br/>Add JWT header,<br/>Set Content-Type]
        RE[Response Interceptor:<br/>Handle 401,<br/>Redirect to login]
        METHODS[Methods:<br/>api.get, api.post]
    end
    
    subgraph Router["React Router"]
        PR[PrivateRoute:<br/>Check token,<br/>Validate/refresh,<br/>Render or redirect]
        PUBLIC[Public Routes:<br/>/login, /signup]
        PROTECTED[Protected Routes:<br/>/lobby, /game/:id]
    end
    
    subgraph Backend["Laravel Backend"]
        AUTH_EP[Auth Endpoints:<br/>/auth/login<br/>/auth/register<br/>/auth/refresh]
        GAME_EP[Game Endpoints:<br/>/games<br/>/games/:id/join]
    end
    
    PR -->|reads token| LS
    PR -->|calls| AF
    
    AF -->|reads/writes| LS
    AF -->|calls| METHODS
    
    METHODS -->|reads token| LS
    METHODS --> RI
    RI --> RE
    RE -->|on 401| PUBLIC
    
    METHODS -->|HTTP requests| AUTH_EP
    METHODS -->|HTTP requests| GAME_EP
    
    PROTECTED -->|wrapped by| PR
    
    Context -->|provides| Router
    API -->|used by| Context
    API -->|used by| Router
    
    style PR fill:#e1f5ff
    style AF fill:#fff4e1
    style LS fill:#ffe1e1
    style METHODS fill:#e1ffe1
```

---

## Key Points

### 1. **Token Storage**
- Tokens are stored in `localStorage` and `sessionStorage` via `persistentStorage.ts`
- Key: `StorageKey.ACCESS_TOKEN` (value: `"access_token"`)

### 2. **API Client Interceptors**
- **Request Interceptor**: Automatically adds `Authorization: JWT {token}` header to every request
- **Response Interceptor**: Catches 401 errors and redirects to `/login` (except when already on login page)

### 3. **Auth Context Responsibilities**
- Manages authentication state (`isAuthenticated`, `currentUser`, `isLoading`)
- Provides utility functions (`isTokenExpired`, `refreshToken`, `logout`)
- Does NOT automatically hydrate auth state on app load (relies on token in storage)

### 4. **PrivateRoute Logic**
- Token-based authentication check (doesn't depend on `isAuthenticated` from context)
- Reads token directly from storage
- Validates token expiry using `isTokenExpired()` from Auth Context
- Attempts token refresh if expired
- Redirects to `/login` if no token or refresh fails
- Shows loading spinner during validation
- Renders protected content when token is valid

### 5. **Token Refresh Strategy**
- PrivateRoute checks token on route entry
- If expired, calls `refreshToken()` from Auth Context
- Auth Context sends old token to backend `/auth/refresh`
- Backend returns new token (if old token is valid for refresh)
- New token is stored and route allows access

### 6. **Logout Process**
- Clears all auth state in Auth Context
- Removes token from all storage locations (localStorage, sessionStorage, cookies)
- Hard redirects to `/login` using `window.location.href`

---

## File Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                   App Entry Point                        │
│                   src/index.js                           │
│              (wraps app with AuthProvider)               │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────────┐
│  Auth Context │◄────────│  Private Route   │
│               │ provides│                  │
│ - state       │  auth   │ - checks token   │
│ - functions   │ funcs   │ - validates      │
└───────┬───────┘         └─────────┬────────┘
        │                           │
        │ uses                      │ uses
        │                           │
        ▼                           ▼
┌───────────────────────────────────────────┐
│            API Client                     │
│                                           │
│ - request interceptor (add JWT)          │
│ - response interceptor (handle 401)      │
│ - methods: get(), post()                 │
└──────────────┬────────────────────────────┘
               │
               │ reads/writes
               │
               ▼
┌──────────────────────────────────────────┐
│      Persistent Storage Utils            │
│                                          │
│ - getItem(ACCESS_TOKEN)                 │
│ - setItem(ACCESS_TOKEN, token)          │
│ - removeItem(ACCESS_TOKEN)              │
└──────────────────────────────────────────┘
```

---

## Environment Variables

```env
# .env or .env.local
REACT_APP_API_URL=http://localhost:8000/coup
```

- API Client uses this to construct base URL
- Default: `http://localhost:8000/coup`

---

## Next Steps

1. **Create Login/Signup Pages** - Forms that call API Client with credentials
2. **Implement Router** - Set up React Router with public and private routes
3. **Add Auth Initialization** - Optionally add logic to Auth Context to restore auth state on app load
4. **Build Protected Pages** - Game lobby, game room, profile, etc.
5. **Handle Token Expiry** - Add automatic token refresh on API 401 responses (in addition to route guards)
