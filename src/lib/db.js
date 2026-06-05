import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';

const dbPath = path.join(process.cwd(), 'raillink.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function seedBaseData() {
  const stationsCount = db.prepare('SELECT COUNT(*) AS count FROM stations').get().count;
  if (stationsCount > 0) return;

  const now = new Date().toISOString();
  const users = [
    { id: randomUUID(), name: 'Admin', email: 'admin@raillink.local', password_hash: 'demo', role: 'admin' },
    { id: randomUUID(), name: 'Demo User', email: 'user@raillink.local', password_hash: 'demo', role: 'customer' },
  ];

  const stations = [
    { id: randomUUID(), code: 'HAN', name: 'Hanoi Central', city: 'Hanoi' },
    { id: randomUUID(), code: 'DAN', name: 'Da Nang', city: 'Da Nang' },
    { id: randomUUID(), code: 'SGN', name: 'Saigon', city: 'Ho Chi Minh City' },
    { id: randomUUID(), code: 'HUE', name: 'Hue', city: 'Hue' },
  ];

  const trains = [
    { id: randomUUID(), name: 'SE1 Express', train_type: 'Express', total_seats: 40 },
    { id: randomUUID(), name: 'HN Local', train_type: 'Local', total_seats: 32 },
  ];

  const routes = [
    { id: randomUUID(), name: 'Hanoi - Da Nang', origin_station_id: stations[0].id, destination_station_id: stations[1].id, distance_km: 764, train_type: 'Express' },
    { id: randomUUID(), name: 'Da Nang - Saigon', origin_station_id: stations[1].id, destination_station_id: stations[2].id, distance_km: 935, train_type: 'Express' },
    { id: randomUUID(), name: 'Hanoi - Hue', origin_station_id: stations[0].id, destination_station_id: stations[3].id, distance_km: 690, train_type: 'Local' },
  ];

  const schedules = [
    {
      id: randomUUID(),
      train_id: trains[0].id,
      route_id: routes[0].id,
      departure_time: '08:00',
      arrival_time: '18:30',
      travel_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      seat_class: 'Economy',
      available_seats: 28,
      price: 42,
    },
    {
      id: randomUUID(),
      train_id: trains[0].id,
      route_id: routes[1].id,
      departure_time: '09:30',
      arrival_time: '21:00',
      travel_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      seat_class: 'Business',
      available_seats: 20,
      price: 64,
    },
    {
      id: randomUUID(),
      train_id: trains[1].id,
      route_id: routes[2].id,
      departure_time: '06:00',
      arrival_time: '16:15',
      travel_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      seat_class: 'Economy',
      available_seats: 30,
      price: 35,
    },
  ];

  const insertUser = db.prepare('INSERT INTO users (id,name,email,password_hash,role,created_at) VALUES (@id,@name,@email,@password_hash,@role,@created_at)');
  users.forEach((u) => insertUser.run({ ...u, created_at: now }));

  const insertStation = db.prepare('INSERT INTO stations (id,code,name,city) VALUES (@id,@code,@name,@city)');
  stations.forEach((s) => insertStation.run(s));

  const insertTrain = db.prepare('INSERT INTO trains (id,name,train_type,total_seats) VALUES (@id,@name,@train_type,@total_seats)');
  trains.forEach((t) => insertTrain.run(t));

  const insertRoute = db.prepare('INSERT INTO routes (id,name,origin_station_id,destination_station_id,distance_km,train_type) VALUES (@id,@name,@origin_station_id,@destination_station_id,@distance_km,@train_type)');
  routes.forEach((r) => insertRoute.run(r));

  const insertPrice = db.prepare('INSERT INTO ticket_prices (id,route_id,seat_class,price) VALUES (@id,@route_id,@seat_class,@price)');
  routes.forEach((route) => {
    insertPrice.run({ id: randomUUID(), route_id: route.id, seat_class: 'Economy', price: 35 });
    insertPrice.run({ id: randomUUID(), route_id: route.id, seat_class: 'Business', price: 60 });
  });

  const insertSchedule = db.prepare('INSERT INTO schedules (id,train_id,route_id,departure_time,arrival_time,travel_date,seat_class,available_seats,price) VALUES (@id,@train_id,@route_id,@departure_time,@arrival_time,@travel_date,@seat_class,@available_seats,@price)');
  const insertSeat = db.prepare('INSERT INTO seats (id,schedule_id,seat_number,seat_class,is_booked) VALUES (@id,@schedule_id,@seat_number,@seat_class,@is_booked)');
  schedules.forEach((schedule) => {
    insertSchedule.run(schedule);
    for (let i = 1; i <= 40; i += 1) {
      insertSeat.run({
        id: randomUUID(),
        schedule_id: schedule.id,
        seat_number: `S${i.toString().padStart(2, '0')}`,
        seat_class: schedule.seat_class,
        is_booked: i > schedule.available_seats ? 1 : 0,
      });
    }
  });
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS stations (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      origin_station_id TEXT NOT NULL,
      destination_station_id TEXT NOT NULL,
      distance_km INTEGER NOT NULL,
      train_type TEXT NOT NULL,
      FOREIGN KEY(origin_station_id) REFERENCES stations(id),
      FOREIGN KEY(destination_station_id) REFERENCES stations(id)
    );
    CREATE TABLE IF NOT EXISTS trains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      train_type TEXT NOT NULL,
      total_seats INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      train_id TEXT NOT NULL,
      route_id TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      seat_class TEXT NOT NULL,
      available_seats INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(train_id) REFERENCES trains(id),
      FOREIGN KEY(route_id) REFERENCES routes(id)
    );
    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      seat_number TEXT NOT NULL,
      seat_class TEXT NOT NULL,
      is_booked INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(schedule_id) REFERENCES schedules(id)
    );
    CREATE TABLE IF NOT EXISTS ticket_prices (
      id TEXT PRIMARY KEY,
      route_id TEXT NOT NULL,
      seat_class TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(route_id) REFERENCES routes(id)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      schedule_id TEXT NOT NULL,
      booking_code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(schedule_id) REFERENCES schedules(id)
    );
    CREATE TABLE IF NOT EXISTS passengers (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      id_number TEXT NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_at TEXT NOT NULL,
      transaction_ref TEXT NOT NULL,
      FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );
  `);

  seedBaseData();
}

initDb();

export default db;
