import { randomUUID } from 'crypto';
import db from '@/lib/db';

export function listStations() {
  return db.prepare('SELECT * FROM stations ORDER BY city, name').all();
}

export function searchSchedules({ from, to, date, seatClass, trainType, sortBy = 'price_asc' }) {
  let query = `
    SELECT s.id, s.departure_time, s.arrival_time, s.travel_date, s.seat_class, s.available_seats, s.price,
           t.name AS train_name, t.train_type,
           r.name AS route_name, r.distance_km,
           os.name AS origin_name, ds.name AS destination_name
    FROM schedules s
    JOIN trains t ON t.id = s.train_id
    JOIN routes r ON r.id = s.route_id
    JOIN stations os ON os.id = r.origin_station_id
    JOIN stations ds ON ds.id = r.destination_station_id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ' AND os.id = ?';
    params.push(from);
  }
  if (to) {
    query += ' AND ds.id = ?';
    params.push(to);
  }
  if (date) {
    query += ' AND s.travel_date = ?';
    params.push(date);
  }
  if (seatClass) {
    query += ' AND s.seat_class = ?';
    params.push(seatClass);
  }
  if (trainType) {
    query += ' AND t.train_type = ?';
    params.push(trainType);
  }

  const sortOptions = {
    price_asc: 's.price ASC',
    price_desc: 's.price DESC',
    departure_asc: 's.departure_time ASC',
    arrival_asc: 's.arrival_time ASC',
  };
  query += ` ORDER BY ${sortOptions[sortBy] || sortOptions.price_asc}`;

  return db.prepare(query).all(...params).map((row) => ({
    ...row,
    duration: `${Math.max(1, Math.round(row.distance_km / 70))}h`,
  }));
}

export function getScheduleDetails(id) {
  const schedule = db
    .prepare(
      `SELECT s.*, t.name AS train_name, t.train_type, r.name AS route_name,
              os.name AS origin_name, ds.name AS destination_name
       FROM schedules s
       JOIN trains t ON t.id = s.train_id
       JOIN routes r ON r.id = s.route_id
       JOIN stations os ON os.id = r.origin_station_id
       JOIN stations ds ON ds.id = r.destination_station_id
       WHERE s.id = ?`
    )
    .get(id);
  if (!schedule) return null;

  const seats = db
    .prepare('SELECT id, seat_number, seat_class, is_booked FROM seats WHERE schedule_id = ? ORDER BY seat_number')
    .all(id);

  return { ...schedule, seats };
}

export function createBooking({ userId, scheduleId, seatIds, passengers, paymentMethod }) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) throw new Error('Schedule not found');
  if (!seatIds?.length) throw new Error('At least one seat is required');

  const freeSeatCount = db
    .prepare(`SELECT COUNT(*) AS count FROM seats WHERE schedule_id = ? AND id IN (${seatIds.map(() => '?').join(',')}) AND is_booked = 0`)
    .get(scheduleId, ...seatIds).count;
  if (freeSeatCount !== seatIds.length) throw new Error('One or more selected seats are unavailable');

  const bookingId = randomUUID();
  const bookingCode = `RL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const totalPrice = schedule.price * seatIds.length;

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO bookings (id,user_id,schedule_id,booking_code,status,total_price,created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(bookingId, userId, scheduleId, bookingCode, 'CONFIRMED', totalPrice, new Date().toISOString());

    const insertPassenger = db.prepare(
      'INSERT INTO passengers (id,booking_id,full_name,age,id_number) VALUES (?, ?, ?, ?, ?)'
    );
    passengers.forEach((p) => insertPassenger.run(randomUUID(), bookingId, p.fullName, Number(p.age || 0), p.idNumber));

    db.prepare(`UPDATE seats SET is_booked = 1 WHERE schedule_id = ? AND id IN (${seatIds.map(() => '?').join(',')})`).run(
      scheduleId,
      ...seatIds
    );
    db.prepare('UPDATE schedules SET available_seats = available_seats - ? WHERE id = ?').run(seatIds.length, scheduleId);

    db.prepare(
      'INSERT INTO payments (id,booking_id,method,status,amount,paid_at,transaction_ref) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      randomUUID(),
      bookingId,
      paymentMethod || 'Credit Card',
      'PAID',
      totalPrice,
      new Date().toISOString(),
      `TX-${randomUUID().slice(0, 8).toUpperCase()}`
    );
  });

  tx();
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
}

export function listUserBookings(userId) {
  return db
    .prepare(
      `SELECT b.id,b.booking_code,b.status,b.total_price,b.created_at,
              s.travel_date,s.departure_time,s.arrival_time,
              r.name AS route_name
       FROM bookings b
       JOIN schedules s ON s.id = b.schedule_id
       JOIN routes r ON r.id = s.route_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(userId);
}

export function cancelBooking(bookingId, userId) {
  const booking = db
    .prepare('SELECT id,status FROM bookings WHERE id = ? AND user_id = ?')
    .get(bookingId, userId);
  if (!booking) throw new Error('Booking not found');
  if (booking.status === 'CANCELLED') return booking;
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('CANCELLED', bookingId);
  return db.prepare('SELECT id,status FROM bookings WHERE id = ?').get(bookingId);
}

export function getAdminTable(resource) {
  const allowed = ['stations', 'routes', 'trains', 'schedules', 'ticket_prices', 'bookings'];
  if (!allowed.includes(resource)) throw new Error('Unsupported resource');
  return db.prepare(`SELECT * FROM ${resource} LIMIT 100`).all();
}

export function createAdminResource(resource, payload) {
  const id = randomUUID();

  const map = {
    stations: {
      cols: ['id', 'code', 'name', 'city'],
      vals: [id, payload.code, payload.name, payload.city],
    },
    trains: {
      cols: ['id', 'name', 'train_type', 'total_seats'],
      vals: [id, payload.name, payload.train_type, Number(payload.total_seats || 0)],
    },
    routes: {
      cols: ['id', 'name', 'origin_station_id', 'destination_station_id', 'distance_km', 'train_type'],
      vals: [id, payload.name, payload.origin_station_id, payload.destination_station_id, Number(payload.distance_km || 0), payload.train_type],
    },
    schedules: {
      cols: ['id', 'train_id', 'route_id', 'departure_time', 'arrival_time', 'travel_date', 'seat_class', 'available_seats', 'price'],
      vals: [id, payload.train_id, payload.route_id, payload.departure_time, payload.arrival_time, payload.travel_date, payload.seat_class, Number(payload.available_seats || 0), Number(payload.price || 0)],
    },
    ticket_prices: {
      cols: ['id', 'route_id', 'seat_class', 'price'],
      vals: [id, payload.route_id, payload.seat_class, Number(payload.price || 0)],
    },
  };

  const entry = map[resource];
  if (!entry) throw new Error('Resource cannot be created');

  db.prepare(`INSERT INTO ${resource} (${entry.cols.join(',')}) VALUES (${entry.cols.map(() => '?').join(',')})`).run(...entry.vals);
  return { id };
}

export function getBookingStatistics() {
  const totalBookings = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
  const revenue = db.prepare("SELECT COALESCE(SUM(total_price),0) AS value FROM bookings WHERE status = 'CONFIRMED'").get().value;
  const cancelled = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'CANCELLED'").get().count;
  return { totalBookings, revenue, cancelled };
}
