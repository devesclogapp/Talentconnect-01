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
    image: '/service_limpeza.jpg'
  },
  'Reparos': {
    label: 'Reparos',
    icon: Hammer,
    image: '/service_reparos.jpg'
  },
  'Elétrica': {
    label: 'Elétrica',
    icon: Zap,
    image: '/service_eletrica.jpg'
  },
  'Hidráulica': {
    label: 'Hidráulica',
    icon: Droplets,
    image: '/service_hidraulica.jpg'
  },
  'Beleza': {
    label: 'Beleza',
    icon: Sparkles,
    image: '/service_beleza.jpg'
  },
  'Saúde': {
    label: 'Saúde',
    icon: HeartPulse,
    image: '/service_hidraulica.jpg'
  },
  'Pet': {
    label: 'Pet',
    icon: Dog,
    image: '/service_pet.jpg'
  },
  'Mudança': {
    label: 'Mudança',
    icon: Truck,
    image: '/service_mudanca.jpg'
  },
  'Consultoria': {
    label: 'Consultoria',
    icon: Briefcase,
    image: '/service_consultoria.jpg'
  },
  'Manutenção': {
    label: 'Manutenção',
    icon: Hammer,
    image: '/service_reparos.jpg'
  },
  'Digital': {
    label: 'Digital',
    icon: Monitor,
    image: '/service_consultoria.jpg'
  },
  'Elite': {
    label: 'Elite',
    icon: Zap,
    image: '/service_consultoria.jpg'
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
