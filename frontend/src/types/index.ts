export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  avatar?: string;
  skills: string[];
  goals: number;
  assists: number;
  presenceRate: number;
  status: 'titular' | 'reserva' | 'lesionado';
}

export interface Game {
  id: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  result?: string;
  score?: string;
  status: 'agendado' | 'finalizado' | 'cancelado';
}

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  date: string;
}

export interface PaymentSummary {
  paid: number;
  pending: number;
  overdue: number;
}

export interface MonthlyPayment {
  id: string;
  playerId: string;
  playerName: string;
  month: string; // "2026-03"
  amount: number;
  status: 'pago' | 'pendente' | 'vencido';
  paidAt?: string;
  dueDate: string;
}

export interface PresenceRecord {
  id: string;
  gameId: string;
  gameLabel: string;
  date: string;
  players: { playerId: string; playerName: string; present: boolean }[];
}

export const mockPlayers: Player[] = [
  { id: '1', name: 'Rafael Silva', position: 'Atacante', number: 9, skills: ['Finalização', 'Velocidade', 'Drible'], goals: 12, assists: 5, presenceRate: 92, status: 'titular' },
  { id: '2', name: 'Lucas Mendes', position: 'Meia', number: 10, skills: ['Passe', 'Visão', 'Liderança'], goals: 6, assists: 14, presenceRate: 88, status: 'titular' },
  { id: '3', name: 'Bruno Costa', position: 'Zagueiro', number: 3, skills: ['Marcação', 'Cabeceio', 'Força'], goals: 2, assists: 1, presenceRate: 95, status: 'titular' },
  { id: '4', name: 'Diego Rocha', position: 'Goleiro', number: 1, skills: ['Reflexo', 'Posição', 'Saída'], goals: 0, assists: 0, presenceRate: 100, status: 'titular' },
  { id: '5', name: 'André Lima', position: 'Lateral', number: 6, skills: ['Cruzamento', 'Velocidade'], goals: 1, assists: 8, presenceRate: 75, status: 'reserva' },
  { id: '6', name: 'Thiago Santos', position: 'Volante', number: 5, skills: ['Marcação', 'Passe'], goals: 3, assists: 4, presenceRate: 80, status: 'titular' },
];

export const mockGames: Game[] = [
  { id: '1', opponent: 'FC Unidos', date: '2026-03-20', time: '19:00', location: 'Campo Municipal', status: 'agendado' },
  { id: '2', opponent: 'Estrela FC', date: '2026-03-27', time: '20:00', location: 'Arena Norte', status: 'agendado' },
  { id: '3', opponent: 'Real Amigos', date: '2026-04-03', time: '18:30', location: 'Campo Municipal', status: 'agendado' },
  { id: '4', opponent: 'Vila Nova SC', date: '2026-03-06', time: '19:00', location: 'Campo Municipal', result: 'vitória', score: '3 x 1', status: 'finalizado' },
  { id: '5', opponent: 'Atlético Amigos', date: '2026-02-27', time: '20:00', location: 'Arena Norte', result: 'empate', score: '2 x 2', status: 'finalizado' },
  { id: '6', opponent: 'Sport Club Real', date: '2026-02-20', time: '18:30', location: 'Campo Municipal', result: 'derrota', score: '1 x 4', status: 'finalizado' },
  { id: '7', opponent: 'Bola de Ouro FC', date: '2026-02-13', time: '19:00', location: 'Arena Sul', result: 'vitória', score: '2 x 0', status: 'finalizado' },
];

export const mockPayments: PaymentSummary = { paid: 12, pending: 1, overdue: 2 };
export const mockBalance = { total: 2340, entradas: 500, saidas: 200 };

const months = ['2026-01', '2026-02', '2026-03'];
export const mockMonthlyPayments: MonthlyPayment[] = mockPlayers.flatMap((player) =>
  months.map((month, i) => ({
    id: `${player.id}-${month}`,
    playerId: player.id,
    playerName: player.name,
    month,
    amount: 80,
    status: (i < 2 ? 'pago' : (player.id === '5' || player.id === '6' ? 'vencido' : player.id === '4' ? 'pendente' : 'pago')) as MonthlyPayment['status'],
    paidAt: i < 2 ? `${month}-10` : (player.id !== '5' && player.id !== '6' && player.id !== '4' ? `${month}-08` : undefined),
    dueDate: `${month}-15`,
  }))
);

export const mockPresenceRecords: PresenceRecord[] = [
  {
    id: 'p1', gameId: '4', gameLabel: 'vs Vila Nova SC', date: '2026-03-06',
    players: mockPlayers.map((p) => ({ playerId: p.id, playerName: p.name, present: p.id !== '5' })),
  },
  {
    id: 'p2', gameId: '5', gameLabel: 'vs Atlético Amigos', date: '2026-02-27',
    players: mockPlayers.map((p) => ({ playerId: p.id, playerName: p.name, present: p.id !== '6' })),
  },
  {
    id: 'p3', gameId: '6', gameLabel: 'vs Sport Club Real', date: '2026-02-20',
    players: mockPlayers.map((p) => ({ playerId: p.id, playerName: p.name, present: p.id !== '5' && p.id !== '6' })),
  },
  {
    id: 'p4', gameId: '7', gameLabel: 'vs Bola de Ouro FC', date: '2026-02-13',
    players: mockPlayers.map((p) => ({ playerId: p.id, playerName: p.name, present: true })),
  },
];
