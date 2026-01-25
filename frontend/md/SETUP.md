# Frontend Setup Guide

## Environment Configuration

Create a `.env` file in the frontend directory with:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SOCKET_URL=http://localhost:8000

# Game Configuration
REACT_APP_MAX_PLAYERS=6
REACT_APP_MIN_PLAYERS=2
```

## Installation Complete! ✅

The following libraries have been installed and configured:

### 1. **Tailwind CSS** - Styling Framework
- Custom game theme colors (coup-red, coup-gold, coup-dark)
- Pre-built card and button animations
- Configured in `tailwind.config.js`

### 2. **Framer Motion** - Animation Library
- Smooth card flips and transitions
- Drag and drop animations
- Import: `import { motion } from 'framer-motion'`

### 3. **Socket.io-client** - Real-time Communication
- Configured in `src/utils/socket.js`
- Ready for multiplayer game updates
- Usage: `import { initializeSocket, getSocket } from './utils/socket'`

### 4. **Zustand** - State Management
- Game store configured in `src/store/gameStore.js`
- Lightweight and easy to use
- Usage: `import useGameStore from './store/gameStore'`

### 5. **@dnd-kit** - Drag and Drop
- Modern drag-and-drop for cards
- Touch-friendly
- Import: `import { DndContext } from '@dnd-kit/core'`

### 6. **React Router DOM** - Navigation
- Router configured in `src/router/index.js`
- Ready for multi-page setup

### 7. **Axios** - API Client
- Configured in `src/utils/api.js`
- Auto-handles authentication tokens
- Usage: `import { gameAPI, authAPI } from './utils/api'`

## Quick Start Examples

### Using Framer Motion for Card Animation

```jsx
import { motion } from 'framer-motion';

function Card() {
  return (
    <motion.div
      className="card-character"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6 }}
    >
      Card Content
    </motion.div>
  );
}
```

### Using Zustand Store

```jsx
import useGameStore from './store/gameStore';

function GameComponent() {
  const { gameState, setGameState, players } = useGameStore();
  
  return (
    <div>
      <p>Current Players: {players.length}</p>
    </div>
  );
}
```

### Using Socket.io

```jsx
import { useEffect } from 'react';
import { initializeSocket, onGameUpdate } from './utils/socket';

function GameRoom() {
  useEffect(() => {
    const socket = initializeSocket(authToken);
    
    onGameUpdate((gameState) => {
      console.log('Game updated:', gameState);
    });
    
    return () => socket.disconnect();
  }, []);
}
```

### Using Drag and Drop

```jsx
import { DndContext, useDraggable } from '@dnd-kit/core';

function DraggableCard({ id }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      Drag me!
    </div>
  );
}
```

## File Structure Created

```
src/
├── store/
│   └── gameStore.js          # Zustand game state
├── utils/
│   ├── api.js                # Axios configuration
│   ├── socket.js             # Socket.io setup
│   └── gameHelpers.js        # Game utility functions
├── constants/
│   └── characters.js         # Character & action definitions
└── router/
    └── index.js              # React Router setup
```

## Next Steps

1. Create component files in `src/components/`
2. Create page files in `src/pages/`
3. Update `src/index.js` to use the router
4. Start building your game UI!

## Tailwind Utility Classes

Use these pre-configured classes:

```jsx
// Buttons
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>

// Cards
<div className="card-character">Character Card</div>
<div className="card-flipped">Revealed Card</div>

// Game Table
<div className="game-table">Game Content</div>
```

## Running the App

```bash
npm start
```

Visit http://localhost:3000
