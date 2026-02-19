import React from 'react';
import {
  Sparkles,
  Hammer,
  Zap,
  Droplets,
  HeartPulse,
  Dog,
  Truck,
  Briefcase,
  Monitor,
  LucideIcon
} from 'lucide-react';

export interface CategoryInfo {
  label: string;
  icon: LucideIcon;
  image: string;
}

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  'Limpeza': {
    label: 'Limpeza',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695ce6958?w=800&q=80'
  },
  'Reparos': {
    label: 'Reparos',
    icon: Hammer,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80'
  },
  'Elétrica': {
    label: 'Elétrica',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80'
  },
  'Hidráulica': {
    label: 'Hidráulica',
    icon: Droplets,
    image: 'https://images.unsplash.com/photo-1585704032915-c3400ca1f963?w=800&q=80'
  },
  'Beleza': {
    label: 'Beleza',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&q=80'
  },
  'Saúde': {
    label: 'Saúde',
    icon: HeartPulse,
    image: 'https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=800&q=80'
  },
  'Pet': {
    label: 'Pet',
    icon: Dog,
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80'
  },
  'Mudança': {
    label: 'Mudança',
    icon: Truck,
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dba221?w=800&q=80'
  },
  'Consultoria': {
    label: 'Consultoria',
    icon: Briefcase,
    image: 'https://images.unsplash.com/photo-1454165833772-d99628a5ffef?w=800&q=80'
  },
  'Manutenção': {
    label: 'Manutenção',
    icon: Hammer,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80'
  },
  'Digital': {
    label: 'Digital',
    icon: Monitor,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80'
  },
  'Elite': {
    label: 'Elite',
    icon: Zap,
    image: 'https://images.unsplash.com/photo-1551288560-199a91ba4188?w=800&q=80'
  },
};

export const getCategoryImage = (category: string): string => {
  if (!category) return CATEGORY_MAP['Elite'].image;
  const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  return CATEGORY_MAP[normalized]?.image || CATEGORY_MAP['Elite'].image;
};

export const CATEGORIES_LIST = Object.entries(CATEGORY_MAP).map(([id, data]) => ({
  id,
  ...data
}));
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const CITIES_BY_STATE: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'São Bernardo do Campo', 'Santo André', 'Guarulhos', 'Osasco', 'Ribeirão Preto', 'Sorocaba'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'São Gonçalo', 'Nova Iguaçu', 'Petrópolis', 'Campos'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Uberaba'],
  'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Canoas', 'Pelotas', 'Santa Maria'],
  'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Chapecó'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari'],
  'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru'],
  'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú'],
  'DF': ['Brasília', 'Taguatinga', 'Ceilândia', 'Guará'],
  'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
  'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica'],
  'PA': ['Belém', 'Ananindeua', 'Santarém', 'Marabá'],
  'AM': ['Manaus', 'Parintins', 'Itacoatiara'],
  'RN': ['Natal', 'Mossoró', 'Parnamirim'],
  'PB': ['João Pessoa', 'Campina Grande'],
  'AL': ['Maceió', 'Arapiraca'],
  'SE': ['Aracaju', 'Nossa Senhora do Socorro'],
  'MT': ['Cuiabá', 'Várzea Grande'],
  'MS': ['Campo Grande', 'Dourados'],
  'PI': ['Teresina', 'Parnaíba'],
  'MA': ['São Luís', 'Imperatriz'],
  'RO': ['Porto Velho', 'Ji-Paraná'],
  'TO': ['Palmas', 'Araguaína'],
  'AC': ['Rio Branco', 'Cruzeiro do Sul'],
  'AP': ['Macapá', 'Santana'],
  'RR': ['Boa Vista']
};
