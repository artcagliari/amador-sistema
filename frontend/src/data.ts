import { CourtSuggestion } from './types';

export const suggestions: CourtSuggestion[] = [
  {
    id: '1',
    name: 'Infinity',
    neighborhood: 'Botafogo',
    rating: 5,
    imageUrl:
      'https://images.unsplash.com/photo-1603297631959-7eb6f5f96f98?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '2',
    name: 'Chuta-chuta',
    neighborhood: 'Centro',
    rating: 4.5,
    imageUrl:
      'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: '3',
    name: 'Praca Centenario',
    neighborhood: 'Zona Sul',
    rating: 4.7,
    imageUrl:
      'https://images.unsplash.com/photo-1570498839593-e565b39455fc?auto=format&fit=crop&w=1200&q=80',
  },
];

export const notifications = [
  'Voce recebeu um convite para jogo hoje as 20h.',
  'Seu horario de quinta foi confirmado.',
  'Nova quadra disponivel perto de voce.',
  'Um amigo respondeu ao seu convite.',
  'Seu perfil teve novos acessos esta semana.',
  'Recomendamos completar seus esportes favoritos.',
];

export const nearbySlots = [
  { id: '1', title: 'Quinta 19:00', place: 'Quadra Infinity', available: '3 vagas' },
  { id: '2', title: 'Sabado 09:00', place: 'Arena Botafogo', available: '6 vagas' },
];
