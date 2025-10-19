import { db } from '../server/db.js';
import { users, children, groups } from '../shared/schema.js';
import { hashPassword } from '../server/auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('🚀 Starte Migration der Mock-Daten...');

  try {
    // Gruppen erstellen
    console.log('📝 Erstelle Gruppen...');
    const groupsData = await db.insert(groups).values([
      { id: 1, name: 'Sonnengruppe' },
      { id: 2, name: 'Regenbogengruppe' },
      { id: 3, name: 'Sternengruppe' },
    ]).returning();
    console.log(`✅ ${groupsData.length} Gruppen erstellt`);

    // Benutzer erstellen
    console.log('📝 Erstelle Benutzer...');
    const hashedPassword = await hashPassword('password');

    const usersData = await db.insert(users).values([
      {
        id: 1,
        username: 'meier',
        password: hashedPassword,
        name: 'Familie Meier',
        email: 'meier@example.com',
        role: 'parent',
        avatarUrl: 'https://i.pravatar.cc/150?u=meier',
      },
      {
        id: 2,
        username: 'huber',
        password: hashedPassword,
        name: 'Familie Huber',
        email: 'huber@example.com',
        role: 'parent',
        avatarUrl: 'https://i.pravatar.cc/150?u=huber',
      },
      {
        id: 99,
        username: 'admin',
        password: hashedPassword,
        name: 'Kita Leitung',
        email: 'admin@kinderhaus-wolfgang.de',
        role: 'admin',
        avatarUrl: '',
      },
    ]).returning();
    console.log(`✅ ${usersData.length} Benutzer erstellt`);

    // Kinder erstellen
    console.log('📝 Erstelle Kinder...');
    const childrenData = await db.insert(children).values([
      {
        id: 101,
        name: 'Anna Meier',
        parentId: 1,
        groupId: 1,
        avatarUrl: 'https://picsum.photos/seed/annameier/100/100',
      },
      {
        id: 102,
        name: 'Max Meier',
        parentId: 1,
        groupId: 2,
        avatarUrl: 'https://picsum.photos/seed/maxmeier/100/100',
      },
      {
        id: 103,
        name: 'Sophie Huber',
        parentId: 2,
        groupId: 1,
        avatarUrl: 'https://picsum.photos/seed/sophiehuber/100/100',
      },
    ]).returning();
    console.log(`✅ ${childrenData.length} Kinder erstellt`);

    console.log('\n✨ Migration erfolgreich abgeschlossen!');
    console.log('\n📋 Test-Zugangsdaten:');
    console.log('   Benutzername: meier    | Passwort: password');
    console.log('   Benutzername: huber    | Passwort: password');
    console.log('   Benutzername: admin    | Passwort: password');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error);
    process.exit(1);
  }
}

migrate();
