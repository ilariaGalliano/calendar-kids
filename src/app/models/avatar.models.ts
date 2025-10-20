// Avatar e palette di colori per i bambini
export interface ColorPalette {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  gradient: string;
  shadow: string;
}

export interface KidAvatar {
  id: string;
  name: string;
  emoji: string;
  palette: ColorPalette;
  category: 'animals' | 'fantasy' | 'classic' | 'nature';
}

// Palette pastello predefinite
export const PASTEL_PALETTES: { [key: string]: ColorPalette } = {
  // Rosa pastello
  pink: {
    name: 'Rosa Dolce',
    primary: '#FFB3D9',      // Rosa pastello principale
    secondary: '#FFC9E1',    // Rosa più chiaro
    accent: '#FF9BAA',       // Rosa accento (esistente)
    background: '#FFF5F8',   // Sfondo rosa molto chiaro
    surface: '#FFFFFF',      // Superfici bianche
    text: '#8B5A7A',         // Testo rosa scuro
    gradient: 'linear-gradient(135deg, #FFB3D9 0%, #FFC9E1 50%, #FFE1EC 100%)',
    shadow: 'rgba(255, 179, 217, 0.3)'
  },

  // Azzurro pastello
  blue: {
    name: 'Cielo Sereno',
    primary: '#A8D8F0',      // Azzurro pastello principale
    secondary: '#C2E5F7',    // Azzurro più chiaro
    accent: '#6C8CFF',       // Azzurro accento (esistente)
    background: '#F0F8FF',   // Sfondo azzurro molto chiaro
    surface: '#FFFFFF',      // Superfici bianche
    text: '#4A6B8A',         // Testo azzurro scuro
    gradient: 'linear-gradient(135deg, #A8D8F0 0%, #C2E5F7 50%, #E1F2FA 100%)',
    shadow: 'rgba(168, 216, 240, 0.3)'
  },

  // Verde pastello
  green: {
    name: 'Prato Fresco',
    primary: '#B8E6B8',      // Verde pastello principale
    secondary: '#D1F2D1',    // Verde più chiaro
    accent: '#7ED8A4',       // Verde accento (esistente)
    background: '#F0FFF0',   // Sfondo verde molto chiaro
    surface: '#FFFFFF',      // Superfici bianche
    text: '#5A8B5A',         // Testo verde scuro
    gradient: 'linear-gradient(135deg, #B8E6B8 0%, #D1F2D1 50%, #E8F8E8 100%)',
    shadow: 'rgba(184, 230, 184, 0.3)'
  },

  // Giallo pastello
  yellow: {
    name: 'Sole Dolce',
    primary: '#FFE4B8',      // Giallo pastello principale
    secondary: '#FFEFD1',    // Giallo più chiaro
    accent: '#FFD47A',       // Giallo accento (esistente)
    background: '#FFFCF0',   // Sfondo giallo molto chiaro
    surface: '#FFFFFF',      // Superfici bianche
    text: '#B8860B',         // Testo giallo scuro
    gradient: 'linear-gradient(135deg, #FFE4B8 0%, #FFEFD1 50%, #FFF8E8 100%)',
    shadow: 'rgba(255, 228, 184, 0.3)'
  }
};

// Avatar predefiniti per ogni categoria
export const PREDEFINED_AVATARS: KidAvatar[] = [
  // Animali - Rosa
  { 
    id: 'unicorn', 
    name: '🦄 Unicorno', 
    emoji: '🦄', 
    palette: PASTEL_PALETTES['pink'],
    category: 'fantasy'
  },
  { 
    id: 'cat', 
    name: '🐱 Gattino', 
    emoji: '🐱', 
    palette: PASTEL_PALETTES['pink'],
    category: 'animals'
  },
  
  // Azzurro
  { 
    id: 'dolphin', 
    name: '🐬 Delfino', 
    emoji: '🐬', 
    palette: PASTEL_PALETTES['blue'],
    category: 'animals'
  },
  { 
    id: 'penguin', 
    name: '🐧 Pinguino', 
    emoji: '🐧', 
    palette: PASTEL_PALETTES['blue'],
    category: 'animals'
  },
  
  // Verde
  { 
    id: 'frog', 
    name: '🐸 Ranocchia', 
    emoji: '🐸', 
    palette: PASTEL_PALETTES['green'],
    category: 'animals'
  },
  { 
    id: 'turtle', 
    name: '🐢 Tartaruga', 
    emoji: '🐢', 
    palette: PASTEL_PALETTES['green'],
    category: 'animals'
  },
  
  // Giallo
  { 
    id: 'duck', 
    name: '🦆 Paperella', 
    emoji: '🦆', 
    palette: PASTEL_PALETTES['yellow'],
    category: 'animals'
  },
  { 
    id: 'star', 
    name: '⭐ Stellina', 
    emoji: '⭐', 
    palette: PASTEL_PALETTES['yellow'],
    category: 'fantasy'
  },
  
  // Più opzioni per ogni palette
  { 
    id: 'butterfly', 
    name: '🦋 Farfalla', 
    emoji: '🦋', 
    palette: PASTEL_PALETTES['pink'],
    category: 'nature'
  },
  { 
    id: 'whale', 
    name: '🐋 Balena', 
    emoji: '🐋', 
    palette: PASTEL_PALETTES['blue'],
    category: 'animals'
  },
  { 
    id: 'dinosaur', 
    name: '🦕 Dinosauro', 
    emoji: '🦕', 
    palette: PASTEL_PALETTES['green'],
    category: 'animals'
  },
  { 
    id: 'bee', 
    name: '🐝 Apetta', 
    emoji: '🐝', 
    palette: PASTEL_PALETTES['yellow'],
    category: 'animals'
  }
];

// Interfaccia per il profilo bambino con avatar selezionato
export interface KidProfile {
  id: string;
  name: string;
  selectedAvatar: KidAvatar;
  isActive: boolean;
}