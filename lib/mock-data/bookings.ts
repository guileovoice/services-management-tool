import type { Booking } from '@/lib/types'
import { format, addDays, subDays, setHours, setMinutes } from 'date-fns'

const today = new Date()
const baseDate = format(today, 'yyyy-MM-dd')

const createBooking = (
  id: number,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  staffId: string,
  staffName: string,
  serviceId: string,
  serviceName: string,
  durationMin: number,
  price: number,
  dayOffset: number,
  hour: number,
  minute: number,
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'IN_PROGRESS',
  channel: 'VOICE' | 'WHATSAPP' | 'SMS' | 'WEB' | 'WALK_IN',
  notes?: string
): Booking => {
  const bookingDate = addDays(today, dayOffset)
  const scheduledAt = setMinutes(setHours(bookingDate, hour), minute)
  const endsAt = new Date(scheduledAt.getTime() + durationMin * 60000)
  
  return {
    id: `booking-${id}`,
    bookingRef: `STU-${String(id).padStart(4, '0')}`,
    tenantId: 'tenant-1',
    customerId: `cust-${id}`,
    customerName,
    customerPhone,
    customerEmail,
    staffId,
    staffName,
    serviceId,
    serviceName,
    serviceDurationMin: durationMin,
    servicePrice: price,
    scheduledAt: scheduledAt.toISOString(),
    endsAt: endsAt.toISOString(),
    status,
    channel,
    notes,
    reminderSent: status !== 'PENDING',
    depositPaid: false,
    paymentStatus: 'UNPAID',
    createdAt: subDays(scheduledAt, Math.floor(Math.random() * 5) + 1).toISOString(),
    updatedAt: scheduledAt.toISOString(),
  }
}

export const bookings: Booking[] = [
  // Today - May 19, 2026
  createBooking(1, 'Sofia Chen', '+1 (718) 555-1234', 'sofia.chen@email.com', 'staff-2', 'Jessica Park', 'svc-5', 'Balayage', 180, 200, 0, 9, 0, 'COMPLETED', 'VOICE'),
  createBooking(2, 'James Williams', '+1 (718) 555-2345', 'james.w@email.com', 'staff-1', 'Marcus Silva', 'svc-10', 'Hair + Beard Combo', 60, 55, 0, 9, 0, 'COMPLETED', 'WEB'),
  createBooking(3, 'Priya Patel', '+1 (718) 555-3456', 'priya.p@email.com', 'staff-3', 'Priya Sharma', 'svc-12', 'Gel Manicure', 60, 50, 0, 9, 30, 'IN_PROGRESS', 'WHATSAPP'),
  createBooking(4, 'Carlos Mendez', '+1 (718) 555-4567', 'carlos.m@email.com', 'staff-5', 'Alex Rivera', 'svc-1', "Men's Haircut", 45, 35, 0, 10, 0, 'NO_SHOW', 'VOICE'),
  createBooking(5, 'Aisha Johnson', '+1 (718) 555-5678', 'aisha.j@email.com', 'staff-4', 'Devon Chase', 'svc-3', 'Blowout', 45, 55, 0, 10, 30, 'COMPLETED', 'SMS'),
  createBooking(6, 'Tyler Brooks', '+1 (718) 555-6789', 'tyler.b@email.com', 'staff-1', 'Marcus Silva', 'svc-1', "Men's Haircut", 45, 35, 0, 11, 0, 'COMPLETED', 'WEB'),
  createBooking(7, 'Maya Rodriguez', '+1 (718) 555-7890', 'maya.r@email.com', 'staff-2', 'Jessica Park', 'svc-6', 'Full Color', 120, 120, 0, 11, 30, 'IN_PROGRESS', 'VOICE'),
  createBooking(8, 'David Kim', '+1 (718) 555-8901', 'david.k@email.com', 'staff-5', 'Alex Rivera', 'svc-9', 'Beard Shape-Up', 30, 30, 0, 12, 0, 'COMPLETED', 'WALK_IN'),
  createBooking(9, 'Emma Wilson', '+1 (718) 555-9012', 'emma.w@email.com', 'staff-3', 'Priya Sharma', 'svc-13', 'Classic Pedicure', 60, 45, 0, 13, 0, 'CONFIRMED', 'PHONE'),
  createBooking(10, 'Ryan O\'Brien', '+1 (718) 555-0123', 'ryan.o@email.com', 'staff-1', 'Marcus Silva', 'svc-8', 'Beard Trim', 20, 20, 0, 13, 30, 'CONFIRMED', 'WEB'),
  createBooking(11, 'Sarah Thompson', '+1 (718) 555-1111', 'sarah.t@email.com', 'staff-2', 'Jessica Park', 'svc-2', "Women's Cut + Style", 60, 65, 0, 14, 0, 'CONFIRMED', 'WHATSAPP'),
  createBooking(12, 'Lisa Chang', '+1 (718) 555-2222', 'lisa.c@email.com', 'staff-3', 'Priya Sharma', 'svc-11', 'Classic Manicure', 45, 35, 0, 14, 30, 'CONFIRMED', 'SMS'),
  createBooking(13, 'Mike Davis', '+1 (718) 555-3333', 'mike.d@email.com', 'staff-5', 'Alex Rivera', 'svc-1', "Men's Haircut", 45, 35, 0, 15, 0, 'CONFIRMED', 'VOICE'),
  createBooking(14, 'Jennifer Lee', '+1 (718) 555-4444', 'jennifer.l@email.com', 'staff-4', 'Devon Chase', 'svc-18', 'Silk Press', 90, 85, 0, 15, 30, 'PENDING', 'WEB'),
  createBooking(15, 'Kevin Brown', '+1 (718) 555-5555', 'kevin.b@email.com', 'staff-1', 'Marcus Silva', 'svc-10', 'Hair + Beard Combo', 60, 55, 0, 16, 30, 'PENDING', 'PHONE'),
  createBooking(16, 'Nicole Martinez', '+1 (718) 555-6666', 'nicole.m@email.com', 'staff-2', 'Jessica Park', 'svc-7', 'Highlights', 150, 150, 0, 17, 0, 'PENDING', 'WHATSAPP'),
  
  // Tomorrow - May 20, 2026
  createBooking(17, 'Rachel Kim', '+1 (718) 555-7777', 'rachel.k@email.com', 'staff-2', 'Jessica Park', 'svc-5', 'Balayage', 180, 200, 1, 10, 0, 'CONFIRMED', 'WEB'),
  createBooking(18, 'Chris Anderson', '+1 (718) 555-8888', 'chris.a@email.com', 'staff-5', 'Alex Rivera', 'svc-1', "Men's Haircut", 45, 35, 1, 10, 30, 'CONFIRMED', 'WALK_IN'),
  createBooking(19, 'Amanda Garcia', '+1 (718) 555-9999', 'amanda.g@email.com', 'staff-3', 'Priya Sharma', 'svc-12', 'Gel Manicure', 60, 50, 1, 11, 0, 'CONFIRMED', 'SMS'),
  createBooking(20, 'Brandon Scott', '+1 (718) 555-1212', 'brandon.s@email.com', 'staff-1', 'Marcus Silva', 'svc-1', "Men's Haircut", 45, 35, 1, 12, 0, 'CONFIRMED', 'WEB'),
  createBooking(21, 'Stephanie White', '+1 (718) 555-2323', 'stephanie.w@email.com', 'staff-4', 'Devon Chase', 'svc-2', "Women's Cut + Style", 60, 65, 1, 13, 0, 'CONFIRMED', 'VOICE'),
  createBooking(22, 'Daniel Taylor', '+1 (718) 555-3434', 'daniel.t@email.com', 'staff-5', 'Alex Rivera', 'svc-9', 'Beard Shape-Up', 30, 30, 1, 14, 0, 'CONFIRMED', 'PHONE'),
  
  // May 21
  createBooking(23, 'Megan Moore', '+1 (718) 555-4545', 'megan.m@email.com', 'staff-2', 'Jessica Park', 'svc-21', 'Root Touch-Up', 90, 80, 2, 10, 0, 'CONFIRMED', 'WHATSAPP'),
  createBooking(24, 'Jason Miller', '+1 (718) 555-5656', 'jason.m@email.com', 'staff-1', 'Marcus Silva', 'svc-17', "Men's Haircut", 45, 35, 2, 10, 30, 'CONFIRMED', 'WEB'),
  createBooking(25, 'Ashley Jackson', '+1 (718) 555-6767', 'ashley.j@email.com', 'staff-4', 'Devon Chase', 'svc-20', 'Natural Styles', 120, 90, 2, 11, 0, 'CONFIRMED', 'VOICE'),
  createBooking(26, 'Matthew Harris', '+1 (718) 555-7878', 'matthew.h@email.com', 'staff-5', 'Alex Rivera', 'svc-8', 'Beard Trim', 20, 20, 2, 14, 0, 'CONFIRMED', 'WALK_IN'),
  
  // May 22
  createBooking(27, 'Samantha Clark', '+1 (718) 555-8989', 'samantha.c@email.com', 'staff-3', 'Priya Sharma', 'svc-14', 'Gel Pedicure', 75, 60, 3, 9, 30, 'CONFIRMED', 'SMS'),
  createBooking(28, 'Andrew Lewis', '+1 (718) 555-9090', 'andrew.l@email.com', 'staff-1', 'Marcus Silva', 'svc-10', 'Hair + Beard Combo', 60, 55, 3, 11, 0, 'CONFIRMED', 'WEB'),
  createBooking(29, 'Lauren Walker', '+1 (718) 555-1010', 'lauren.w@email.com', 'staff-2', 'Jessica Park', 'svc-6', 'Full Color', 120, 120, 3, 12, 0, 'CONFIRMED', 'VOICE'),
  
  // May 23 (Saturday)
  createBooking(30, 'Brian Hall', '+1 (718) 555-1111', 'brian.h@email.com', 'staff-5', 'Alex Rivera', 'svc-1', "Men's Haircut", 45, 35, 4, 9, 0, 'CONFIRMED', 'PHONE'),
  createBooking(31, 'Kimberly Allen', '+1 (718) 555-2222', 'kimberly.a@email.com', 'staff-2', 'Jessica Park', 'svc-5', 'Balayage', 180, 200, 4, 10, 0, 'CONFIRMED', 'WEB'),
  createBooking(32, 'Eric Young', '+1 (718) 555-3333', 'eric.y@email.com', 'staff-1', 'Marcus Silva', 'svc-1', "Men's Haircut", 45, 35, 4, 13, 0, 'CONFIRMED', 'WALK_IN'),
  createBooking(33, 'Michelle King', '+1 (718) 555-4444', 'michelle.k@email.com', 'staff-3', 'Priya Sharma', 'svc-15', 'Acrylic Full Set', 90, 75, 4, 14, 0, 'CONFIRMED', 'WHATSAPP'),
  
  // May 24 (Sunday)
  createBooking(34, 'Patrick Wright', '+1 (718) 555-5555', 'patrick.w@email.com', 'staff-5', 'Alex Rivera', 'svc-9', 'Beard Shape-Up', 30, 30, 5, 10, 0, 'CONFIRMED', 'WEB'),
  createBooking(35, 'Christina Lopez', '+1 (718) 555-6666', 'christina.l@email.com', 'staff-3', 'Priya Sharma', 'svc-23', 'Deep Cleansing Facial', 60, 90, 5, 11, 0, 'CONFIRMED', 'SMS'),
  
  // Past bookings (completed)
  createBooking(36, 'Nathan Hill', '+1 (718) 555-7777', 'nathan.h@email.com', 'staff-1', 'Marcus Silva', 'svc-1', "Men's Haircut", 45, 35, -1, 10, 0, 'COMPLETED', 'WEB'),
  createBooking(37, 'Diana Scott', '+1 (718) 555-8888', 'diana.s@email.com', 'staff-2', 'Jessica Park', 'svc-2', "Women's Cut + Style", 60, 65, -1, 12, 0, 'COMPLETED', 'VOICE'),
  createBooking(38, 'Aaron Green', '+1 (718) 555-9999', 'aaron.g@email.com', 'staff-5', 'Alex Rivera', 'svc-8', 'Beard Trim', 20, 20, -1, 14, 0, 'COMPLETED', 'PHONE'),
  createBooking(39, 'Courtney Adams', '+1 (718) 555-0000', 'courtney.a@email.com', 'staff-3', 'Priya Sharma', 'svc-12', 'Gel Manicure', 60, 50, -1, 15, 0, 'COMPLETED', 'WHATSAPP'),
  createBooking(40, 'Derek Nelson', '+1 (718) 555-1112', 'derek.n@email.com', 'staff-1', 'Marcus Silva', 'svc-10', 'Hair + Beard Combo', 60, 55, -2, 11, 0, 'COMPLETED', 'WEB'),
  createBooking(41, 'Vanessa Carter', '+1 (718) 555-2223', 'vanessa.c@email.com', 'staff-4', 'Devon Chase', 'svc-3', 'Blowout', 45, 55, -2, 13, 0, 'COMPLETED', 'VOICE'),
  createBooking(42, 'Travis Mitchell', '+1 (718) 555-3334', 'travis.m@email.com', 'staff-5', 'Alex Rivera', 'svc-1', "Men's Haircut", 45, 35, -2, 15, 0, 'COMPLETED', 'WALK_IN'),
  createBooking(43, 'Emily Roberts', '+1 (718) 555-4445', 'emily.r@email.com', 'staff-2', 'Jessica Park', 'svc-7', 'Highlights', 150, 150, -3, 10, 0, 'COMPLETED', 'WEB'),
  createBooking(44, 'Mark Turner', '+1 (718) 555-5556', 'mark.t@email.com', 'staff-1', 'Marcus Silva', 'svc-8', 'Beard Trim', 20, 20, -3, 12, 0, 'COMPLETED', 'PHONE'),
  createBooking(45, 'Jessica Phillips', '+1 (718) 555-6667', 'jessica.p@email.com', 'staff-3', 'Priya Sharma', 'svc-11', 'Classic Manicure', 45, 35, -3, 14, 0, 'CANCELLED', 'SMS'),
  createBooking(46, 'Steven Campbell', '+1 (718) 555-7778', 'steven.c@email.com', 'staff-5', 'Alex Rivera', 'svc-9', 'Beard Shape-Up', 30, 30, -4, 11, 0, 'COMPLETED', 'WEB'),
  createBooking(47, 'Angela Parker', '+1 (718) 555-8889', 'angela.p@email.com', 'staff-4', 'Devon Chase', 'svc-18', "Women's Cut + Style", 60, 65, -4, 15, 0, 'COMPLETED', 'VOICE'),
]

export const getBookingById = (id: string) => bookings.find(b => b.id === id)

export const getBookingsByStaff = (staffId: string) => bookings.filter(b => b.staffId === staffId)

export const getBookingsByDate = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd')
  return bookings.filter(b => b.scheduledAt.startsWith(dateStr))
}

export const getTodayBookings = () => getBookingsByDate(today)

export const getUpcomingBookings = () => {
  return bookings.filter(b => new Date(b.scheduledAt) >= today && b.status !== 'CANCELLED')
}