export interface Task {
  id: string;
  text: string;
  priority: 'red' | 'yellow' | 'blue';
  done: boolean;
}

export interface Post {
  id: string;
  title: string;
  pillar: string;
  timing: string;
  tags: string;
  body: string;
}

export interface Application {
  id: number;
  company: string;
  role: string;
  source: string;
  status: 'applied' | 'pending' | 'interview' | 'rejected' | 'offer';
  date: string;
  followup: string;
  email: string;
  url: string;
  notes: string;
}

export interface Gig {
  id: string;
  platform: string;
  title: string;
  category: string;
  tags: string;
  pricing: {
    Basic: { usd: string; aed: string };
    Standard: { usd: string; aed: string };
    Premium: { usd: string; aed: string };
  };
  description: string;
  promo: string;
}

export interface Pillar {
  id: string;
  label: string;
  color: string;
  desc: string;
}

export interface MakeScenario {
  name: string;
  status: string;
  ops: number;
  desc: string;
  prompt: string;
}
