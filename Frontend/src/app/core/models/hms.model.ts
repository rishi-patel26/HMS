export interface Patient {
  id: number;
  uhid: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContact: string;
  allergies: string;
  insuranceProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientRequest {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup?: string;
  emergencyContact?: string;
  allergies?: string;
  insuranceProvider?: string;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  patientUhid: string;
  doctorId: number;
  doctorName: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reasonForVisit: string;
  notes: string;
  priority: string;
  department: string;
  createdBy: string;
  createdAt: string;
}

export interface AppointmentRequest {
  patientId: number;
  doctorId: number;
  appointmentTime: string;
  reasonForVisit?: string;
  notes?: string;
  priority?: string;
  department?: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';

export interface Encounter {
  id: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  patientUhid: string;
  doctorId: number;
  doctorName: string;
  episodeId: number | null;
  appointmentId: number | null;
  visitType: VisitType;
  status: EncounterStatus;
  visitDate: string;
  checkinTime: string;
  priority: string;
  notes: string;
  roomNumber: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EncounterRequest {
  patientId: number;
  doctorId: number;
  appointmentId?: number;
  episodeId?: number;
  visitType: VisitType;
  priority?: string;
  notes?: string;
  roomNumber?: string;
}

export type VisitType = 'OPD' | 'IPD';
export type EncounterStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED';

export interface Bill {
  id: number;
  billNumber: string;
  encounterId: number;
  patientName: string;
  patientUhid: string;
  patientId: number;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  items: BillItem[];
  createdAt: string;
}

export interface BillItem {
  id: number;
  billId: number;
  serviceId: number;
  serviceName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface BillItemRequest {
  serviceId: number;
  quantity: number;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: string;
}

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface Episode {
  id: number;
  patientId: number;
  patientName: string;
  patientUhid: string;
  episodeType: string;
  description: string;
  startDate: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  status: string;
  severity: string;
  notes: string;
  diagnosisSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface EpisodeRequest {
  patientId: number;
  episodeType: string;
  description: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  severity?: string;
  notes?: string;
  diagnosisSummary?: string;
}

export interface ServiceCatalogItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface ServiceCatalogRequest {
  name: string;
  price: number;
  description?: string;
  category?: string;
}

export interface Consultation {
  id: number;
  encounterId: number;
  patientName: string;
  patientUhid: string;
  doctorName: string;
  patientId: number;
  doctorId: number;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  doctorNotes: string;
  followupDate: string | null;
  testsRequested: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsultationRequest {
  encounterId: number;
  symptoms?: string;
  diagnosis: string;
  prescription: string;
  doctorNotes?: string;
  followupDate?: string;
  testsRequested?: string;
}

// Nurse module models
export interface DoctorOption {
  id: number;
  username: string;
  email: string;
}

export interface DoctorPatientItem {
  encounterId: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  patientUhid: string;
  gender: string;
  phone: string;
  encounterStatus: EncounterStatus;
  visitType: VisitType;
  priority: string;
  visitDate: string;
  checkinTime: string;
  notes: string;
  roomNumber: string;
}

export interface PatientCaseTimeline {
  encounterId: number;
  encounterNumber: string;
  encounterStatus: EncounterStatus;
  visitType: VisitType;
  priority: string;
  visitDate: string;
  checkinTime: string;
  encounterNotes: string;
  roomNumber: string;
  patientId: number;
  patientName: string;
  patientUhid: string;
  gender: string;
  dob: string | null;
  phone: string;
  bloodGroup: string;
  allergies: string;
  doctorId: number;
  doctorName: string;
  consultationId: number | null;
  symptoms: string | null;
  diagnosis: string | null;
  prescription: string | null;
  doctorNotes: string | null;
  followupDate: string | null;
  testsRequested: string | null;
  consultationCreatedAt: string | null;
}

export interface NurseDashboardStats {
  // Today
  totalActiveDoctors: number;
  totalActiveEncounters: number;
  waitingPatients: number;
  inConsultationPatients: number;
  completedToday: number;
  todayEncounters: number;
  todayConsultations: number;
  // Totals
  totalEncounters: number;
  totalPatients: number;
  totalConsultations: number;
  totalDoctors: number;
  // Bed requests
  myPendingBedRequests: number;
  myTotalBedRequests: number;
  totalPendingBedRequests: number;
  totalBedRequests: number;
}

export type BedAllocationPriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';
export type BedAllocationRequestStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'ALLOCATED' | 'REJECTED';
export type BedType = 'ICU' | 'GENERAL' | 'PRIVATE';
export type WardType = 'ICU' | 'GENERAL' | 'PRIVATE';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type BedAssignmentStatus = 'ALLOCATED' | 'ADMITTED' | 'DISCHARGED' | 'COMPLETED';
export type BedEventType =
  | 'REQUEST_CREATED'
  | 'UNDER_REVIEW'
  | 'REQUEST_REJECTED'
  | 'BED_ALLOCATED'
  | 'BED_TRANSFERRED'
  | 'PATIENT_ADMITTED'
  | 'PATIENT_DISCHARGED'
  | 'BED_RELEASED';

export interface BedAllocationRequestItem {
  id: number;
  encounterId: number;
  encounterNumber: string;
  patientId: number;
  patientName: string;
  patientUhid: string;
  requestedBy: number;
  requestedByName: string;
  requiredBedType: BedType;
  preferredWardId: number | null;
  preferredWardName: string | null;
  priority: BedAllocationPriority;
  status: BedAllocationRequestStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBedAllocationRequest {
  encounterId: number;
  patientId: number;
  requiredBedType: BedType;
  preferredWardId?: number;
  priority: BedAllocationPriority;
  notes?: string;
}

export interface WardItem {
  id: number;
  name: string;
  type: WardType;
  capacity: number;
  occupiedBeds: number;
  active: boolean;
  occupancyRate: number;
}

export interface BedItem {
  id: number;
  bedNumber: string;
  wardId: number;
  wardName: string;
  bedType: BedType;
  status: BedStatus;
}

export interface BedAssignmentItem {
  id: number;
  encounterId: number;
  bedId: number;
  bedNumber: string;
  bedType: BedType;
  wardId: number;
  wardName: string;
  assignedBy: number;
  assignedByName: string;
  assignedAt: string;
  admittedAt: string | null;
  dischargedAt: string | null;
  status: BedAssignmentStatus;
}

export interface BedEventItem {
  id: number;
  encounterId: number;
  eventType: BedEventType;
  timestamp: string;
  performedBy: number;
  performedByName: string;
  notes: string | null;
}

export interface BedManagerDashboard {
  priorityQueue: BedAllocationRequestItem[];
  wardOccupancy: WardItem[];
  availableBeds: BedItem[];
  activeAssignments: BedAssignmentItem[];
}

export interface BedCalendarDay {
  date: string;
  availableBeds: number;
  occupiedBeds: number;
  maintenanceBeds: number;
}

export interface DashboardStats {
  // Admin
  totalPatients: number;
  totalAppointmentsToday: number;
  totalEncountersToday: number;
  totalRevenueToday: number;
  activeEpisodes: number;
  totalUsers: number;
  totalAppointments: number;
  totalConsultations: number;
  totalBills: number;
  totalEncounters: number;
  totalEpisodes: number;
  totalRevenue: number;
  todayConsultations: number;
  todayBills: number;
  // Frontdesk
  todayAppointments: number;
  waitingPatients: number;
  checkedInPatients: number;
  pendingBills: number;
  todayRevenue: number;
  totalAppointmentsAll: number;
  totalEncountersAll: number;
  totalEpisodesAll: number;
  totalPatientsAll: number;
  totalRevenueAll: number;
  // Doctor
  encounterQueue: number;
  patientsWaiting: number;
  doctorActiveEpisodes: number;
  followUpPatients: number;
  doctorTodayAppointments: number;
  doctorCompletedConsultations: number;
  doctorTodayPatients: number;
  doctorTotalAppointments: number;
  doctorTotalConsultations: number;
  doctorTotalEncounters: number;
  doctorTodayConsultations: number;
  doctorCompletedToday: number;
}

export interface DailyTrendResponse {
  labels: string[];
  patientRegistrations: number[];
  appointments: number[];
  consultations: number[];
}

export interface RevenueTrendResponse {
  labels: string[];
  revenueData: number[];
}

export interface EncounterStatusDistribution {
  labels: string[];
  data: number[];
  colors: string[];
}

export interface AppointmentCalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  patientName: string;
  doctorName: string;
  status: string;
  backgroundColor: string;
  borderColor: string;
}

export interface DepartmentStats {
  departments: string[];
  appointmentCounts: number[];
  consultationCounts: number[];
}

// Notification models
export type NotificationType = 'APPOINTMENT' | 'BED_ALLOCATION' | 'GENERAL';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  targetUser: string | null;
  targetRole: string | null;
  isRead: boolean;
  createdAt: string;
}
