import Dexie, { type EntityTable } from 'dexie';

export interface Portfolio {
  id: number;
  name: string;
  lastUpdated: Date;
  rawCsv: string;    // Keeps the audit trail (the CSV history)
  holdings: any[];   // Stores the consolidated results
}

const db = new Dexie('ShareAuditorDB') as Dexie & {
  portfolios: EntityTable<Portfolio, 'id'>;
};

// Schema: ++id is the auto-incrementing primary key
db.version(1).stores({
  portfolios: '++id, name, lastUpdated'
});

export { db };