
import { Service } from './types';

export const MOCK_SERVICES: Service[] = [
  {
    id: '1',
    name: 'Limpeza Residencial Pesada',
    category: 'Limpeza',
    price: 25,
    rating: 4.9,
    reviews: 1200,
    image: 'https://picsum.photos/seed/clean1/800/450',
    provider: 'Sarah Johnson',
    description: 'Inclui aspiração, espanar e passar pano em todos os cômodos.'
  },
  {
    id: '2',
    name: 'Reparo Elétrico',
    category: 'Reparos',
    price: 45,
    rating: 4.7,
    reviews: 850,
    image: 'https://picsum.photos/seed/elec1/800/450',
    provider: 'Michael Chen',
    description: 'Conserto de tomadas, interruptores e problemas de fiação.'
  },
  {
    id: '3',
    name: 'Serviço de Salão Completo',
    category: 'Beleza',
    price: 60,
    rating: 4.8,
    reviews: 500,
    image: 'https://picsum.photos/seed/salon1/800/450',
    provider: 'Elena Smith',
    description: 'Corte de cabelo, limpeza de pele e manicure/pedicure.'
  }
];

export const CATEGORIES = [
  { name: 'Beleza', icon: 'content_cut' },
  { name: 'Limpeza', icon: 'cleaning_services' },
  { name: 'Reparos', icon: 'handyman' },
  { name: 'Encanador', icon: 'plumbing' },
  { name: 'Elétrica', icon: 'electrical_services' }
];
