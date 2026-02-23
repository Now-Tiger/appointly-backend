import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000);
const hoursFromNow = (n: number) => new Date(now.getTime() + n * 3_600_000);

function atHour(base: Date, hour: number, min = 0): Date {
  const d = new Date(base);
  d.setHours(hour, min, 0, 0);
  return d;
}

const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

async function cleanDatabase() {
  await prisma.outboundWebhookDelivery.deleteMany();
  await prisma.outboundWebhookConfig.deleteMany();
  await prisma.waitingListEntry.deleteMany();
  await prisma.deliveryAttempt.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.analyticsDaily.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.integrationConnection.deleteMany();
  await prisma.usageRecord.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.staffSchedule.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.recurringAppointmentSeries.deleteMany();
  await prisma.paymentIntent.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.notificationTemplate.deleteMany();
  await prisma.businessHours.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staffMember.deleteMany();
  await prisma.location.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.organization.deleteMany();
}

async function main() {
  console.log("🌱 Seeding database...");
  await cleanDatabase();
  console.log("🗑️  Cleaned existing data");

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANIZATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const healthFirstOrg = await prisma.organization.create({
    data: { name: "HealthFirst Network" },
  });

  console.log("  ✅ Organizations");

  // ═══════════════════════════════════════════════════════════════════════════
  // TENANTS — covers every TenantStatus + org-attached vs standalone
  // ═══════════════════════════════════════════════════════════════════════════

  const sunriseClinic = await prisma.tenant.create({
    data: {
      name: "Sunrise Clinic",
      slug: "sunrise-clinic",
      status: "ACTIVE",
      organizationId: healthFirstOrg.id,
    },
  });

  const glowSalon = await prisma.tenant.create({
    data: { name: "Glow Beauty Salon", slug: "glow-beauty", status: "ACTIVE" },
  });

  const fitZoneGym = await prisma.tenant.create({
    data: { name: "FitZone Gym", slug: "fitzone-gym", status: "ONBOARDING" },
  });

  const quickFixDental = await prisma.tenant.create({
    data: {
      name: "QuickFix Dental",
      slug: "quickfix-dental",
      status: "SUSPENDED",
      organizationId: healthFirstOrg.id,
    },
  });

  const eliteTutoring = await prisma.tenant.create({
    data: { name: "Elite Tutoring", slug: "elite-tutoring", status: "ACTIVE" },
  });

  console.log("✅ Tenants");

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS PROFILES — fully onboarded, partial onboarding, WA-verified/not,
  //   different locales, branding fields populated vs null
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.businessProfile.create({
    data: {
      tenantId: sunriseClinic.id,
      businessName: "Sunrise Family Clinic",
      description:
        "Family medicine and general health consultations serving the community since 2018.",
      phone: "+14155551001",
      email: "admin@sunriseclinic.com",
      website: "https://sunriseclinic.com",
      address: "123 Health Ave, Suite 200",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postalCode: "94102",
      timezone: "America/Los_Angeles",
      whatsappPhoneNumberId: "10987654321",
      whatsappBusinessAccountId: "wa_ba_sunrise_001",
      whatsappVerified: true,
      logoUrl: "https://cdn.appointly.io/logos/sunrise-clinic.png",
      brandColor: "#2563EB",
      defaultBufferMinutes: 10,
      maxConcurrentBookings: 3,
      locale: "en",
      onboardingCompletedAt: daysAgo(90),
    },
  });

  await prisma.businessProfile.create({
    data: {
      tenantId: glowSalon.id,
      businessName: "Glow Beauty Salon & Spa",
      description: "Premium hair, nails, and spa treatments in downtown.",
      phone: "+14155552001",
      email: "hello@glowbeauty.com",
      website: "https://glowbeauty.com",
      address: "456 Style Blvd",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postalCode: "94103",
      timezone: "America/Los_Angeles",
      whatsappPhoneNumberId: "20987654321",
      whatsappBusinessAccountId: "wa_ba_glow_001",
      whatsappVerified: true,
      brandColor: "#EC4899",
      defaultBufferMinutes: 15,
      maxConcurrentBookings: 2,
      locale: "en",
      onboardingCompletedAt: daysAgo(60),
    },
  });

  await prisma.businessProfile.create({
    data: {
      tenantId: fitZoneGym.id,
      businessName: "FitZone Fitness Center",
      description: "Group fitness classes and personal training.",
      phone: "+14155553001",
      email: "info@fitzone.com",
      city: "Oakland",
      state: "CA",
      country: "US",
      timezone: "America/Los_Angeles",
      whatsappVerified: false,
      defaultBufferMinutes: 5,
      maxConcurrentBookings: 10,
      locale: "en",
    },
  });

  await prisma.businessProfile.create({
    data: {
      tenantId: quickFixDental.id,
      businessName: "QuickFix Dental Care",
      description: "Emergency and routine dental care.",
      phone: "+14155554001",
      email: "front@quickfixdental.com",
      address: "789 Dental Row",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postalCode: "94104",
      timezone: "America/Los_Angeles",
      whatsappPhoneNumberId: "30987654321",
      whatsappBusinessAccountId: "wa_ba_quickfix_001",
      whatsappVerified: true,
      locale: "en",
      onboardingCompletedAt: daysAgo(120),
    },
  });

  await prisma.businessProfile.create({
    data: {
      tenantId: eliteTutoring.id,
      businessName: "Elite Tutoring Academy",
      phone: "+919876543210",
      email: "contact@elitetutoring.in",
      city: "Mumbai",
      country: "IN",
      timezone: "Asia/Kolkata",
      whatsappPhoneNumberId: "91987654321",
      whatsappBusinessAccountId: "wa_ba_elite_001",
      whatsappVerified: true,
      locale: "hi",
      onboardingCompletedAt: daysAgo(30),
    },
  });

  console.log("✅ Business profiles");

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATIONS — active / inactive, multi-branch under one tenant
  // ═══════════════════════════════════════════════════════════════════════════

  const locMain = await prisma.location.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Main Branch — Financial District",
      address: "123 Health Ave, Suite 200",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postalCode: "94102",
      phone: "+14155551001",
      timezone: "America/Los_Angeles",
      isActive: true,
    },
  });

  const locMission = await prisma.location.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Mission District Branch",
      address: "500 Mission St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      postalCode: "94105",
      phone: "+14155551002",
      timezone: "America/Los_Angeles",
      isActive: true,
    },
  });

  await prisma.location.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Former Downtown Kiosk",
      address: "999 Market St",
      city: "San Francisco",
      state: "CA",
      country: "US",
      timezone: "America/Los_Angeles",
      isActive: false,
    },
  });

  console.log("✅ Locations");

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF MEMBERS — every StaffRole, active/inactive, location-assigned/not
  // ═══════════════════════════════════════════════════════════════════════════

  const drChen = await prisma.staffMember.create({
    data: {
      tenantId: sunriseClinic.id,
      externalAuthId: "auth0|sunrise_owner_001",
      email: "dr.chen@sunriseclinic.com",
      fullName: "Dr. Sarah Chen",
      phone: "+14155551101",
      role: "OWNER",
      avatarUrl: "https://cdn.appointly.io/avatars/dr-chen.jpg",
      isActive: true,
      locationId: locMain.id,
    },
  });

  const nursePatel = await prisma.staffMember.create({
    data: {
      tenantId: sunriseClinic.id,
      externalAuthId: "auth0|sunrise_mgr_001",
      email: "nurse.patel@sunriseclinic.com",
      fullName: "Nurse Priya Patel",
      phone: "+14155551102",
      role: "MANAGER",
      isActive: true,
      locationId: locMain.id,
    },
  });

  const drKim = await prisma.staffMember.create({
    data: {
      tenantId: sunriseClinic.id,
      externalAuthId: "auth0|sunrise_staff_001",
      email: "dr.kim@sunriseclinic.com",
      fullName: "Dr. James Kim",
      role: "STAFF",
      isActive: true,
      locationId: locMission.id,
    },
  });

  const formerStaff = await prisma.staffMember.create({
    data: {
      tenantId: sunriseClinic.id,
      externalAuthId: "auth0|sunrise_former_001",
      email: "former.staff@sunriseclinic.com",
      fullName: "Dr. Alex Former",
      role: "STAFF",
      isActive: false,
    },
  });

  await prisma.staffMember.create({
    data: {
      tenantId: sunriseClinic.id,
      externalAuthId: "auth0|sunrise_ro_001",
      email: "receptionist.lee@sunriseclinic.com",
      fullName: "Amy Lee",
      role: "READONLY",
      isActive: true,
      locationId: locMain.id,
    },
  });

  const salonOwner = await prisma.staffMember.create({
    data: {
      tenantId: glowSalon.id,
      externalAuthId: "auth0|glow_owner_001",
      email: "maria@glowbeauty.com",
      fullName: "Maria Santos",
      phone: "+14155552101",
      role: "OWNER",
      isActive: true,
    },
  });

  const stylistJen = await prisma.staffMember.create({
    data: {
      tenantId: glowSalon.id,
      externalAuthId: "auth0|glow_staff_001",
      email: "jen@glowbeauty.com",
      fullName: "Jennifer Wu",
      role: "STAFF",
      isActive: true,
    },
  });

  const stylistTom = await prisma.staffMember.create({
    data: {
      tenantId: glowSalon.id,
      externalAuthId: "auth0|glow_staff_002",
      email: "tom@glowbeauty.com",
      fullName: "Tom Rivera",
      role: "STAFF",
      isActive: true,
    },
  });

  const gymOwner = await prisma.staffMember.create({
    data: {
      tenantId: fitZoneGym.id,
      externalAuthId: "auth0|fitzone_owner_001",
      email: "coach@fitzone.com",
      fullName: "Coach Mike Johnson",
      phone: "+14155553101",
      role: "OWNER",
      isActive: true,
    },
  });

  const tutorOwner = await prisma.staffMember.create({
    data: {
      tenantId: eliteTutoring.id,
      externalAuthId: "auth0|elite_owner_001",
      email: "raj@elitetutoring.in",
      fullName: "Raj Sharma",
      phone: "+919876543211",
      role: "OWNER",
      isActive: true,
    },
  });

  const tutorStaff = await prisma.staffMember.create({
    data: {
      tenantId: eliteTutoring.id,
      externalAuthId: "auth0|elite_staff_001",
      email: "anita@elitetutoring.in",
      fullName: "Anita Desai",
      role: "STAFF",
      isActive: true,
    },
  });

  console.log("✅ Staff members");

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICES — INDIVIDUAL / GROUP / RECURRING, active/inactive, free/$,
  //   capacity limits, multiple currencies
  // ═══════════════════════════════════════════════════════════════════════════

  const svcCheckup = await prisma.service.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "General Checkup",
      description:
        "Comprehensive health examination with vitals, blood work review, and consultation.",
      durationMinutes: 30,
      price: 150.0,
      currency: "USD",
      isActive: true,
      sortOrder: 1,
      appointmentType: "INDIVIDUAL",
    },
  });

  const svcSpecialist = await prisma.service.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Specialist Consultation",
      description: "In-depth consultation for specific health concerns.",
      durationMinutes: 45,
      price: 250.0,
      currency: "USD",
      isActive: true,
      sortOrder: 2,
      appointmentType: "INDIVIDUAL",
    },
  });

  const svcFreeConsult = await prisma.service.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Free Initial Consultation",
      description: "Complimentary 15-minute meet-and-greet for new patients.",
      durationMinutes: 15,
      price: 0,
      currency: "USD",
      isActive: true,
      sortOrder: 3,
      appointmentType: "INDIVIDUAL",
    },
  });

  await prisma.service.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "House Call Visit",
      description: "Home visit — discontinued due to liability.",
      durationMinutes: 60,
      price: 500.0,
      currency: "USD",
      isActive: false,
      sortOrder: 99,
      appointmentType: "INDIVIDUAL",
    },
  });

  const svcGroupWellness = await prisma.service.create({
    data: {
      tenantId: sunriseClinic.id,
      name: "Group Wellness Workshop",
      description: "Monthly nutrition and wellness group session.",
      durationMinutes: 60,
      price: 40.0,
      currency: "USD",
      isActive: true,
      sortOrder: 4,
      appointmentType: "GROUP",
      capacityLimit: 15,
    },
  });

  const svcHaircut = await prisma.service.create({
    data: {
      tenantId: glowSalon.id,
      name: "Haircut & Styling",
      durationMinutes: 45,
      price: 65.0,
      isActive: true,
      sortOrder: 1,
    },
  });

  const svcColor = await prisma.service.create({
    data: {
      tenantId: glowSalon.id,
      name: "Full Color Treatment",
      description: "Complete hair coloring with premium products.",
      durationMinutes: 120,
      price: 180.0,
      isActive: true,
      sortOrder: 2,
    },
  });

  const svcManicure = await prisma.service.create({
    data: {
      tenantId: glowSalon.id,
      name: "Gel Manicure",
      durationMinutes: 30,
      price: 45.0,
      isActive: true,
      sortOrder: 3,
    },
  });

  const svcHIIT = await prisma.service.create({
    data: {
      tenantId: fitZoneGym.id,
      name: "HIIT Group Class",
      description: "High-intensity interval training, all fitness levels.",
      durationMinutes: 45,
      price: 20.0,
      isActive: true,
      sortOrder: 1,
      appointmentType: "GROUP",
      capacityLimit: 25,
    },
  });

  await prisma.service.create({
    data: {
      tenantId: fitZoneGym.id,
      name: "Personal Training Session",
      durationMinutes: 60,
      price: 80.0,
      isActive: true,
      sortOrder: 2,
      appointmentType: "INDIVIDUAL",
    },
  });

  const svcMath = await prisma.service.create({
    data: {
      tenantId: eliteTutoring.id,
      name: "Mathematics (1-on-1)",
      description: "One-on-one math tutoring for grades 8-12.",
      durationMinutes: 60,
      price: 800.0,
      currency: "INR",
      isActive: true,
      sortOrder: 1,
    },
  });

  await prisma.service.create({
    data: {
      tenantId: eliteTutoring.id,
      name: "Science Group Session",
      description: "Physics and Chemistry group class for competitive exams.",
      durationMinutes: 90,
      price: 500.0,
      currency: "INR",
      isActive: true,
      sortOrder: 2,
      appointmentType: "GROUP",
      capacityLimit: 8,
    },
  });

  const svcWeeklyMath = await prisma.service.create({
    data: {
      tenantId: eliteTutoring.id,
      name: "Weekly Math Package",
      description: "Recurring weekly 1-on-1 math tutoring sessions.",
      durationMinutes: 60,
      price: 3000.0,
      currency: "INR",
      isActive: true,
      sortOrder: 3,
      appointmentType: "RECURRING",
    },
  });

  console.log("✅ Services");

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMERS — loyal / no-show-prone / anonymous / new / multi-locale
  // ═══════════════════════════════════════════════════════════════════════════

  const custAlice = await prisma.customer.create({
    data: {
      tenantId: sunriseClinic.id,
      whatsappPhoneNumber: "+14155560001",
      fullName: "Alice Johnson",
      email: "alice.johnson@email.com",
      locale: "en",
      totalAppointments: 12,
      totalNoShows: 0,
      totalSpent: 1800.0,
      lastInteractionAt: daysAgo(2),
    },
  });

  const custBob = await prisma.customer.create({
    data: {
      tenantId: sunriseClinic.id,
      whatsappPhoneNumber: "+14155560002",
      fullName: "Bob Martinez",
      email: "bob.m@email.com",
      notes: "Prefers morning appointments. Allergic to penicillin.",
      locale: "en",
      totalAppointments: 5,
      totalNoShows: 2,
      totalSpent: 750.0,
      lastInteractionAt: daysAgo(7),
    },
  });

  const custAnon = await prisma.customer.create({
    data: {
      tenantId: sunriseClinic.id,
      whatsappPhoneNumber: "+14155560003",
      locale: "en",
      totalAppointments: 1,
      lastInteractionAt: daysAgo(1),
    },
  });

  const custNew = await prisma.customer.create({
    data: {
      tenantId: sunriseClinic.id,
      whatsappPhoneNumber: "+14155560004",
      fullName: "Diana Park",
      locale: "en",
    },
  });

  const custCarlos = await prisma.customer.create({
    data: {
      tenantId: sunriseClinic.id,
      whatsappPhoneNumber: "+525551234567",
      fullName: "Carlos Reyes",
      locale: "es",
      totalAppointments: 3,
      totalSpent: 450.0,
      lastInteractionAt: daysAgo(14),
    },
  });

  const custEmma = await prisma.customer.create({
    data: {
      tenantId: glowSalon.id,
      whatsappPhoneNumber: "+14155560101",
      fullName: "Emma Thompson",
      email: "emma.t@email.com",
      locale: "en",
      totalAppointments: 20,
      totalNoShows: 1,
      totalSpent: 2600.0,
      lastInteractionAt: daysAgo(3),
    },
  });

  const custSarah = await prisma.customer.create({
    data: {
      tenantId: glowSalon.id,
      whatsappPhoneNumber: "+14155560102",
      fullName: "Sarah Kim",
      locale: "en",
      totalAppointments: 2,
      totalSpent: 130.0,
      lastInteractionAt: daysAgo(30),
    },
  });

  const custPriya = await prisma.customer.create({
    data: {
      tenantId: eliteTutoring.id,
      whatsappPhoneNumber: "+919876540001",
      fullName: "Priya Gupta",
      email: "priya.parent@email.com",
      notes: "Parent of Arjun Gupta (Class 10). Preparing for board exams.",
      locale: "hi",
      totalAppointments: 8,
      totalSpent: 6400.0,
      lastInteractionAt: daysAgo(1),
    },
  });

  const custVikram = await prisma.customer.create({
    data: {
      tenantId: eliteTutoring.id,
      whatsappPhoneNumber: "+919876540002",
      fullName: "Vikram Mehta",
      locale: "en",
      totalAppointments: 3,
      totalNoShows: 1,
      totalSpent: 2400.0,
      lastInteractionAt: daysAgo(10),
    },
  });

  console.log("✅ Customers");

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS HOURS — full week, partial week, after-school hours, weekend only
  // ═══════════════════════════════════════════════════════════════════════════

  const weekdays = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
  ] as const;

  for (const day of weekdays) {
    await prisma.businessHours.create({
      data: {
        tenantId: sunriseClinic.id,
        dayOfWeek: day,
        startTime: "08:00",
        endTime: "18:00",
        isEnabled: true,
      },
    });
  }
  await prisma.businessHours.create({
    data: {
      tenantId: sunriseClinic.id,
      dayOfWeek: "SATURDAY",
      startTime: "09:00",
      endTime: "13:00",
      isEnabled: true,
    },
  });
  await prisma.businessHours.create({
    data: {
      tenantId: sunriseClinic.id,
      dayOfWeek: "SUNDAY",
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false,
    },
  });

  await prisma.businessHours.create({
    data: {
      tenantId: glowSalon.id,
      dayOfWeek: "MONDAY",
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false,
    },
  });
  for (const day of [
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ] as const) {
    await prisma.businessHours.create({
      data: {
        tenantId: glowSalon.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "20:00",
        isEnabled: true,
      },
    });
  }
  await prisma.businessHours.create({
    data: {
      tenantId: glowSalon.id,
      dayOfWeek: "SUNDAY",
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false,
    },
  });

  for (const day of weekdays) {
    await prisma.businessHours.create({
      data: {
        tenantId: eliteTutoring.id,
        dayOfWeek: day,
        startTime: "16:00",
        endTime: "21:00",
        isEnabled: true,
      },
    });
  }
  await prisma.businessHours.create({
    data: {
      tenantId: eliteTutoring.id,
      dayOfWeek: "SATURDAY",
      startTime: "10:00",
      endTime: "18:00",
      isEnabled: true,
    },
  });
  await prisma.businessHours.create({
    data: {
      tenantId: eliteTutoring.id,
      dayOfWeek: "SUNDAY",
      startTime: "10:00",
      endTime: "18:00",
      isEnabled: true,
    },
  });

  console.log("✅ Business hours");

  // ═══════════════════════════════════════════════════════════════════════════
  // STAFF SCHEDULES — per-staff overrides, partial-day, disabled days
  // ═══════════════════════════════════════════════════════════════════════════

  for (const day of ["MONDAY", "WEDNESDAY", "FRIDAY"] as const) {
    await prisma.staffSchedule.create({
      data: {
        staffId: drKim.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "17:00",
        isEnabled: true,
      },
    });
  }
  for (const day of ["TUESDAY", "THURSDAY"] as const) {
    await prisma.staffSchedule.create({
      data: {
        staffId: drKim.id,
        dayOfWeek: day,
        startTime: "12:00",
        endTime: "20:00",
        isEnabled: true,
      },
    });
  }
  await prisma.staffSchedule.create({
    data: {
      staffId: drKim.id,
      dayOfWeek: "SATURDAY",
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false,
    },
  });
  await prisma.staffSchedule.create({
    data: {
      staffId: drKim.id,
      dayOfWeek: "SUNDAY",
      startTime: "00:00",
      endTime: "00:00",
      isEnabled: false,
    },
  });

  await prisma.staffSchedule.create({
    data: {
      staffId: stylistJen.id,
      dayOfWeek: "TUESDAY",
      startTime: "10:00",
      endTime: "14:00",
      isEnabled: true,
    },
  });

  console.log("✅ Staff schedules");

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCKED SLOTS — all-day / partial, staff-specific / tenant-wide,
  //   external calendar sync
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.blockedSlot.create({
    data: {
      tenantId: sunriseClinic.id,
      startTime: daysFromNow(15),
      endTime: daysFromNow(15),
      reason: "Independence Day — Clinic Closed",
      isAllDay: true,
    },
  });

  await prisma.blockedSlot.create({
    data: {
      tenantId: sunriseClinic.id,
      staffId: drChen.id,
      startTime: atHour(daysFromNow(1), 12),
      endTime: atHour(daysFromNow(1), 13),
      reason: "Lunch break",
      isAllDay: false,
    },
  });

  await prisma.blockedSlot.create({
    data: {
      tenantId: sunriseClinic.id,
      staffId: drChen.id,
      startTime: daysFromNow(20),
      endTime: daysFromNow(25),
      reason: "Annual vacation",
      isAllDay: true,
    },
  });

  await prisma.blockedSlot.create({
    data: {
      tenantId: glowSalon.id,
      staffId: salonOwner.id,
      startTime: atHour(daysFromNow(3), 14),
      endTime: atHour(daysFromNow(3), 16),
      reason: "Personal appointment",
      isAllDay: false,
      externalCalendarEventId: "google_cal_evt_abc123xyz",
    },
  });

  console.log("✅ Blocked slots");

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYMENT INTENTS — every PaymentStatus
  // ═══════════════════════════════════════════════════════════════════════════

  const paySucceeded = await prisma.paymentIntent.create({
    data: {
      stripePaymentIntentId: "pi_succeeded_001",
      stripePaymentLinkUrl: "https://pay.stripe.com/link_succeeded_001",
      amount: 150.0,
      currency: "USD",
      status: "SUCCEEDED",
      paidAt: daysAgo(5),
    },
  });

  const payPending = await prisma.paymentIntent.create({
    data: {
      stripePaymentIntentId: "pi_pending_001",
      stripePaymentLinkUrl: "https://pay.stripe.com/link_pending_001",
      amount: 250.0,
      currency: "USD",
      status: "PENDING",
    },
  });

  await prisma.paymentIntent.create({
    data: {
      stripePaymentIntentId: "pi_failed_001",
      amount: 65.0,
      currency: "USD",
      status: "FAILED",
    },
  });

  const payRefunded = await prisma.paymentIntent.create({
    data: {
      stripePaymentIntentId: "pi_refunded_001",
      amount: 45.0,
      currency: "USD",
      status: "REFUNDED",
      refundedAmount: 45.0,
      paidAt: daysAgo(20),
      refundedAt: daysAgo(18),
    },
  });

  const payPartialRefund = await prisma.paymentIntent.create({
    data: {
      stripePaymentIntentId: "pi_partial_refund_001",
      amount: 180.0,
      currency: "USD",
      status: "PARTIALLY_REFUNDED",
      refundedAmount: 90.0,
      paidAt: daysAgo(15),
      refundedAt: daysAgo(10),
    },
  });

  console.log("✅ Payment intents");

  // ═══════════════════════════════════════════════════════════════════════════
  // RECURRING APPOINTMENT SERIES — active / cancelled
  // ═══════════════════════════════════════════════════════════════════════════

  const seriesActive = await prisma.recurringAppointmentSeries.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorOwner.id,
      customerId: custPriya.id,
      recurrenceRule: "FREQ=WEEKLY;BYDAY=SA;COUNT=12",
      startDate: daysAgo(21),
      endDate: daysFromNow(63),
      maxOccurrences: 12,
      isActive: true,
    },
  });

  const seriesCancelled = await prisma.recurringAppointmentSeries.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorStaff.id,
      customerId: custVikram.id,
      recurrenceRule: "FREQ=WEEKLY;BYDAY=WE;COUNT=8",
      startDate: daysAgo(42),
      endDate: daysAgo(14),
      maxOccurrences: 8,
      isActive: false,
    },
  });

  console.log("✅ Recurring appointment series");

  // ═══════════════════════════════════════════════════════════════════════════
  // APPOINTMENTS — every AppointmentStatus, bookedVia variants, with/without
  //   payment, with/without noShowRiskScore, recurring child, location-assigned
  // ═══════════════════════════════════════════════════════════════════════════

  const apptCompleted = await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcCheckup.id,
      staffId: drChen.id,
      customerId: custAlice.id,
      locationId: locMain.id,
      status: "COMPLETED",
      startTime: atHour(daysAgo(5), 9),
      endTime: atHour(daysAgo(5), 9, 30),
      bookedVia: "whatsapp",
      completedAt: atHour(daysAgo(5), 9, 25),
      paymentIntentId: paySucceeded.id,
    },
  });

  const apptConfirmed = await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcSpecialist.id,
      staffId: drChen.id,
      customerId: custCarlos.id,
      locationId: locMain.id,
      status: "CONFIRMED",
      startTime: atHour(now, 14),
      endTime: atHour(now, 14, 45),
      bookedVia: "whatsapp",
      paymentIntentId: payPending.id,
    },
  });

  const apptPending = await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcFreeConsult.id,
      staffId: nursePatel.id,
      customerId: custAnon.id,
      locationId: locMain.id,
      status: "PENDING",
      startTime: atHour(daysFromNow(2), 10),
      endTime: atHour(daysFromNow(2), 10, 15),
      bookedVia: "whatsapp",
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcCheckup.id,
      staffId: drKim.id,
      customerId: custAlice.id,
      locationId: locMission.id,
      status: "IN_PROGRESS",
      startTime: hoursFromNow(-0.25),
      endTime: hoursFromNow(0.25),
      bookedVia: "dashboard",
      notes: "Follow-up from last week's blood work results.",
    },
  });

  const apptCancelled = await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcSpecialist.id,
      staffId: drChen.id,
      customerId: custBob.id,
      locationId: locMain.id,
      status: "CANCELLED",
      startTime: atHour(daysAgo(3), 11),
      endTime: atHour(daysAgo(3), 11, 45),
      bookedVia: "whatsapp",
      cancelledAt: daysAgo(4),
      cancelReason: "Patient requested cancellation — scheduling conflict.",
    },
  });

  const apptNoShow = await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcCheckup.id,
      staffId: nursePatel.id,
      customerId: custBob.id,
      locationId: locMain.id,
      status: "NO_SHOW",
      startTime: atHour(daysAgo(10), 15),
      endTime: atHour(daysAgo(10), 15, 30),
      bookedVia: "whatsapp",
      noShowRiskScore: 0.72,
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: sunriseClinic.id,
      serviceId: svcCheckup.id,
      staffId: drChen.id,
      customerId: custNew.id,
      locationId: locMain.id,
      status: "CONFIRMED",
      startTime: atHour(daysFromNow(5), 10),
      endTime: atHour(daysFromNow(5), 10, 30),
      bookedVia: "dashboard",
      notes: "New patient referral from Dr. Adams.",
    },
  });

  const salonApptDone = await prisma.appointment.create({
    data: {
      tenantId: glowSalon.id,
      serviceId: svcHaircut.id,
      staffId: stylistJen.id,
      customerId: custEmma.id,
      status: "COMPLETED",
      startTime: atHour(daysAgo(3), 10),
      endTime: atHour(daysAgo(3), 10, 45),
      bookedVia: "whatsapp",
      completedAt: atHour(daysAgo(3), 10, 40),
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: glowSalon.id,
      serviceId: svcManicure.id,
      staffId: stylistJen.id,
      customerId: custSarah.id,
      status: "CANCELLED",
      startTime: atHour(daysAgo(18), 14),
      endTime: atHour(daysAgo(18), 14, 30),
      bookedVia: "whatsapp",
      cancelledAt: daysAgo(19),
      cancelReason: "Allergic reaction concern.",
      paymentIntentId: payRefunded.id,
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: glowSalon.id,
      serviceId: svcColor.id,
      staffId: stylistTom.id,
      customerId: custEmma.id,
      status: "COMPLETED",
      startTime: atHour(daysAgo(15), 11),
      endTime: atHour(daysAgo(15), 13),
      bookedVia: "whatsapp",
      completedAt: atHour(daysAgo(15), 12, 45),
      paymentIntentId: payPartialRefund.id,
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: glowSalon.id,
      serviceId: svcHaircut.id,
      staffId: salonOwner.id,
      customerId: custEmma.id,
      status: "CONFIRMED",
      startTime: atHour(daysFromNow(1), 11),
      endTime: atHour(daysFromNow(1), 11, 45),
      bookedVia: "whatsapp",
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorOwner.id,
      customerId: custPriya.id,
      recurringSeriesId: seriesActive.id,
      status: "COMPLETED",
      startTime: atHour(daysAgo(21), 16),
      endTime: atHour(daysAgo(21), 17),
      bookedVia: "whatsapp",
      completedAt: atHour(daysAgo(21), 17),
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorOwner.id,
      customerId: custPriya.id,
      recurringSeriesId: seriesActive.id,
      status: "COMPLETED",
      startTime: atHour(daysAgo(14), 16),
      endTime: atHour(daysAgo(14), 17),
      bookedVia: "whatsapp",
      completedAt: atHour(daysAgo(14), 17),
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorOwner.id,
      customerId: custPriya.id,
      recurringSeriesId: seriesActive.id,
      status: "CONFIRMED",
      startTime: atHour(daysFromNow(3), 16),
      endTime: atHour(daysFromNow(3), 17),
      bookedVia: "whatsapp",
    },
  });

  await prisma.appointment.create({
    data: {
      tenantId: eliteTutoring.id,
      serviceId: svcWeeklyMath.id,
      staffId: tutorStaff.id,
      customerId: custVikram.id,
      recurringSeriesId: seriesCancelled.id,
      status: "CANCELLED",
      startTime: atHour(daysAgo(35), 17),
      endTime: atHour(daysAgo(35), 18),
      bookedVia: "whatsapp",
      cancelledAt: daysAgo(36),
      cancelReason: "Recurring series cancelled by student.",
    },
  });

  console.log("✅ Appointments");

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATION TEMPLATES — WA (approved/pending/rejected), Email, Push,
  //   multi-locale, active/inactive
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.notificationTemplate.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        name: "Booking Confirmation",
        channel: "WHATSAPP",
        body: "Hi {{customerName}}, your {{serviceName}} appointment with {{staffName}} is confirmed for {{dateTime}}. Reply CANCEL to cancel.",
        locale: "en",
        whatsappTemplateName: "booking_confirmation_v1",
        whatsappTemplateStatus: "APPROVED",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "24-Hour Reminder",
        channel: "WHATSAPP",
        body: "Reminder: You have a {{serviceName}} appointment tomorrow at {{dateTime}} with {{staffName}}. Reply CANCEL to cancel.",
        locale: "en",
        whatsappTemplateName: "reminder_24h_v1",
        whatsappTemplateStatus: "APPROVED",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "1-Hour Reminder",
        channel: "WHATSAPP",
        body: "Your {{serviceName}} appointment starts in 1 hour. See you soon!",
        locale: "en",
        whatsappTemplateName: "reminder_1h_v1",
        whatsappTemplateStatus: "APPROVED",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "Cancellation Confirmation",
        channel: "WHATSAPP",
        body: "Your {{serviceName}} appointment on {{dateTime}} has been cancelled.",
        locale: "en",
        whatsappTemplateName: "cancellation_v1",
        whatsappTemplateStatus: "APPROVED",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "Booking Confirmation (Spanish)",
        channel: "WHATSAPP",
        body: "Hola {{customerName}}, tu cita de {{serviceName}} con {{staffName}} está confirmada para {{dateTime}}. Responde CANCELAR para cancelar.",
        locale: "es",
        whatsappTemplateName: "booking_confirmation_es_v1",
        whatsappTemplateStatus: "PENDING",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "Daily Digest Email",
        channel: "EMAIL",
        subject: "Your Appointly Daily Summary — {{date}}",
        body: "Hi {{staffName}},\n\nHere's your schedule for today:\n{{appointmentList}}\n\nTotal: {{count}}\n\nBest,\nAppointly",
        locale: "en",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "New Booking Push",
        channel: "PUSH",
        body: "New booking: {{customerName}} booked {{serviceName}} for {{dateTime}}",
        locale: "en",
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        name: "Old Format Reminder (deprecated)",
        channel: "WHATSAPP",
        body: "You have an appointment tomorrow.",
        locale: "en",
        whatsappTemplateName: "reminder_old_v0",
        whatsappTemplateStatus: "REJECTED",
        isActive: false,
      },
      {
        tenantId: glowSalon.id,
        name: "Booking Confirmation",
        channel: "WHATSAPP",
        body: "Hey {{customerName}}! Your {{serviceName}} with {{staffName}} is booked for {{dateTime}}. Can't wait to see you!",
        locale: "en",
        whatsappTemplateName: "glow_booking_v1",
        whatsappTemplateStatus: "APPROVED",
        isActive: true,
      },
    ],
  });

  console.log("✅ Notification templates");

  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY ATTEMPTS — every DeliveryStatus, every NotificationChannel
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.deliveryAttempt.createMany({
    data: [
      {
        appointmentId: apptCompleted.id,
        channel: "WHATSAPP",
        recipient: "+14155560001",
        status: "DELIVERED",
        externalMessageId: "wamid.HBgNMTQxNTU1NjAwMDF_001",
        idempotencyKey: `wa_confirm_${apptCompleted.id}`,
        payload: {
          templateName: "booking_confirmation_v1",
          params: { customerName: "Alice Johnson" },
        },
        sentAt: daysAgo(6),
        deliveredAt: daysAgo(6),
      },
      {
        appointmentId: apptConfirmed.id,
        channel: "WHATSAPP",
        recipient: "+525551234567",
        status: "SENT",
        externalMessageId: "wamid.HBgNMTQxNTU1NjAwMDF_002",
        idempotencyKey: `wa_confirm_${apptConfirmed.id}`,
        sentAt: daysAgo(1),
      },
      {
        appointmentId: apptPending.id,
        channel: "WHATSAPP",
        recipient: "+14155560003",
        status: "PENDING",
        idempotencyKey: `wa_confirm_${apptPending.id}`,
      },
      {
        appointmentId: apptCancelled.id,
        channel: "WHATSAPP",
        recipient: "+14155560002",
        status: "FAILED",
        idempotencyKey: `wa_cancel_${apptCancelled.id}`,
        errorMessage:
          "WhatsApp API returned 471: Rate limit hit. Retry after 60s.",
        failedAt: daysAgo(4),
      },
      {
        channel: "EMAIL",
        recipient: "bounced@invalid-domain.xyz",
        status: "BOUNCED",
        idempotencyKey: "email_digest_sunrise_20260220",
        errorMessage: "550 5.1.1 Mailbox does not exist",
        sentAt: daysAgo(2),
        failedAt: daysAgo(2),
      },
      {
        appointmentId: salonApptDone.id,
        channel: "PUSH",
        recipient: "ExponentPushToken[xxxxxx_salon_owner]",
        status: "DELIVERED",
        externalMessageId: "expo_receipt_abc123",
        idempotencyKey: `push_new_booking_${salonApptDone.id}`,
        sentAt: daysAgo(3),
        deliveredAt: daysAgo(3),
      },
    ],
  });

  console.log("✅ Delivery attempts");

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICE TOKENS — iOS / Android, active / inactive (old device)
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.deviceToken.createMany({
    data: [
      {
        staffId: drChen.id,
        token: "ExponentPushToken[drchen_ios_abc123]",
        platform: "ios",
        isActive: true,
      },
      {
        staffId: drChen.id,
        token: "ExponentPushToken[drchen_old_device_xyz]",
        platform: "ios",
        isActive: false,
      },
      {
        staffId: nursePatel.id,
        token: "ExponentPushToken[nursepatel_android_def456]",
        platform: "android",
        isActive: true,
      },
      {
        staffId: salonOwner.id,
        token: "ExponentPushToken[maria_ios_ghi789]",
        platform: "ios",
        isActive: true,
      },
      {
        staffId: salonOwner.id,
        token: "ExponentPushToken[maria_android_jkl012]",
        platform: "android",
        isActive: true,
      },
    ],
  });

  console.log("✅ Device tokens");

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTIONS — every SubscriptionPlan + SubscriptionStatus,
  //   with/without Stripe IDs (trial has no Stripe)
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.subscription.create({
    data: {
      tenantId: sunriseClinic.id,
      plan: "PRO",
      status: "ACTIVE",
      stripeCustomerId: "cus_sunrise_001",
      stripeSubscriptionId: "sub_sunrise_001",
      stripePriceId: "price_pro_monthly",
      currentPeriodStart: startOfMonth,
      currentPeriodEnd: endOfMonth,
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: glowSalon.id,
      plan: "GROWTH",
      status: "ACTIVE",
      stripeCustomerId: "cus_glow_001",
      stripeSubscriptionId: "sub_glow_001",
      stripePriceId: "price_growth_monthly",
      monthlyAppointmentLimit: 500,
      currentPeriodStart: startOfMonth,
      currentPeriodEnd: endOfMonth,
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: fitZoneGym.id,
      plan: "STARTER",
      status: "TRIALING",
      monthlyAppointmentLimit: 100,
      trialEndsAt: daysFromNow(14),
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: quickFixDental.id,
      plan: "GROWTH",
      status: "CANCELLED",
      stripeCustomerId: "cus_quickfix_001",
      stripeSubscriptionId: "sub_quickfix_001",
      stripePriceId: "price_growth_monthly",
      monthlyAppointmentLimit: 500,
      currentPeriodStart: startOfLastMonth,
      currentPeriodEnd: endOfLastMonth,
      cancelledAt: daysAgo(15),
    },
  });

  await prisma.subscription.create({
    data: {
      tenantId: eliteTutoring.id,
      plan: "STARTER",
      status: "PAST_DUE",
      stripeCustomerId: "cus_elite_001",
      stripeSubscriptionId: "sub_elite_001",
      stripePriceId: "price_starter_monthly",
      monthlyAppointmentLimit: 100,
      currentPeriodStart: startOfMonth,
      currentPeriodEnd: endOfMonth,
    },
  });

  console.log("✅ Subscriptions");

  // ═══════════════════════════════════════════════════════════════════════════
  // INVOICES — paid / open / past_due / void
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.invoice.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        stripeInvoiceId: "inv_sunrise_202601",
        amountDue: 149.0,
        amountPaid: 149.0,
        currency: "USD",
        status: "paid",
        periodStart: startOfLastMonth,
        periodEnd: endOfLastMonth,
        paidAt: new Date(startOfMonth.getTime() + 86_400_000),
        invoicePdfUrl:
          "https://pay.stripe.com/invoices/sunrise_202601.pdf",
      },
      {
        tenantId: sunriseClinic.id,
        stripeInvoiceId: "inv_sunrise_202602",
        amountDue: 149.0,
        amountPaid: 0,
        currency: "USD",
        status: "open",
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      },
      {
        tenantId: eliteTutoring.id,
        stripeInvoiceId: "inv_elite_202602",
        amountDue: 29.0,
        amountPaid: 0,
        currency: "USD",
        status: "past_due",
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      },
      {
        tenantId: quickFixDental.id,
        stripeInvoiceId: "inv_quickfix_202602",
        amountDue: 79.0,
        amountPaid: 0,
        currency: "USD",
        status: "void",
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      },
    ],
  });

  console.log("✅ Invoices");

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE RECORDS — current + previous period, near-limit tenant
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.usageRecord.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        appointmentCount: 47,
        whatsappMessageCount: 142,
      },
      {
        tenantId: sunriseClinic.id,
        periodStart: startOfLastMonth,
        periodEnd: endOfLastMonth,
        appointmentCount: 89,
        whatsappMessageCount: 267,
      },
      {
        tenantId: glowSalon.id,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        appointmentCount: 31,
        whatsappMessageCount: 93,
      },
      {
        tenantId: eliteTutoring.id,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        appointmentCount: 95,
        whatsappMessageCount: 285,
      },
    ],
  });

  console.log("✅ Usage records");

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBHOOK EVENTS — every WebhookEventStatus, whatsapp + stripe sources
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.webhookEvent.createMany({
    data: [
      {
        source: "whatsapp",
        externalId: "wh_evt_wa_001",
        idempotencyKey: "wa_webhook_msg_001",
        status: "PROCESSED",
        payload: {
          object: "whatsapp_business_account",
          entry: [
            {
              changes: [
                {
                  field: "messages",
                  value: {
                    messages: [
                      { type: "text", text: { body: "Book appointment" } },
                    ],
                  },
                },
              ],
            },
          ],
        },
        processedAt: daysAgo(5),
      },
      {
        source: "whatsapp",
        externalId: "wh_evt_wa_002",
        idempotencyKey: "wa_webhook_msg_002",
        status: "PROCESSING",
        payload: {
          object: "whatsapp_business_account",
          entry: [
            {
              changes: [
                {
                  field: "messages",
                  value: {
                    messages: [{ type: "text", text: { body: "Cancel" } }],
                  },
                },
              ],
            },
          ],
        },
      },
      {
        source: "stripe",
        externalId: "evt_stripe_001",
        idempotencyKey: "stripe_webhook_evt_001",
        status: "PROCESSED",
        payload: {
          type: "invoice.paid",
          data: {
            object: { id: "inv_sunrise_202601", amount_paid: 14900 },
          },
        },
        processedAt: daysAgo(1),
      },
      {
        source: "whatsapp",
        externalId: "wh_evt_wa_003",
        idempotencyKey: "wa_webhook_msg_003",
        status: "FAILED",
        payload: {
          object: "whatsapp_business_account",
          entry: [{ changes: [{ field: "messages" }] }],
        },
        errorMessage:
          "Failed to parse message payload: missing 'value.messages' field",
      },
      {
        source: "whatsapp",
        externalId: "wh_evt_wa_004",
        idempotencyKey: "wa_webhook_msg_004",
        status: "RECEIVED",
        payload: {
          object: "whatsapp_business_account",
          entry: [
            {
              changes: [
                {
                  field: "messages",
                  value: {
                    messages: [
                      {
                        type: "interactive",
                        interactive: { type: "button_reply" },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  });

  console.log("✅ Webhook events");

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS DAILY — 14-day window for clinic, 7-day for salon, includes
  //   weekends with lower traffic
  // ═══════════════════════════════════════════════════════════════════════════

  const analyticsBatch = [];
  for (let i = 1; i <= 14; i++) {
    const day = daysAgo(i);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    analyticsBatch.push({
      tenantId: sunriseClinic.id,
      date: day,
      totalBookings: isWeekend ? 2 + (i % 3) : 5 + (i % 7),
      completedBookings: isWeekend ? 1 + (i % 2) : 4 + (i % 5),
      cancelledBookings: i % 4 === 0 ? 2 : i % 3 === 0 ? 1 : 0,
      noShows: i % 5 === 0 ? 1 : 0,
      revenueCollected: isWeekend ? 300 + i * 20 : 800 + i * 50,
      peakHour: isWeekend ? 10 : 9 + (i % 4),
      topServiceId: i % 2 === 0 ? svcCheckup.id : svcSpecialist.id,
    });
  }
  for (let i = 1; i <= 7; i++) {
    const day = daysAgo(i);
    analyticsBatch.push({
      tenantId: glowSalon.id,
      date: day,
      totalBookings: 3 + (i % 5),
      completedBookings: 2 + (i % 4),
      cancelledBookings: i % 3 === 0 ? 1 : 0,
      noShows: 0,
      revenueCollected: 200 + i * 60,
      peakHour: 11 + (i % 5),
      topServiceId: svcHaircut.id,
    });
  }
  for (const row of analyticsBatch) {
    await prisma.analyticsDaily.create({ data: row });
  }

  console.log("✅ Analytics daily");

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOGS — CREATE / UPDATE / DELETE, staff / customer / system actors
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        actorId: drChen.id,
        actorType: "staff",
        action: "CREATE",
        entityType: "Appointment",
        entityId: apptCompleted.id,
        after: {
          status: "PENDING",
          serviceId: svcCheckup.id,
          customerId: custAlice.id,
        },
        ipAddress: "203.0.113.42",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
      {
        tenantId: sunriseClinic.id,
        actorId: drChen.id,
        actorType: "staff",
        action: "UPDATE",
        entityType: "Appointment",
        entityId: apptCompleted.id,
        before: { status: "PENDING" },
        after: {
          status: "COMPLETED",
          completedAt: daysAgo(5).toISOString(),
        },
        ipAddress: "203.0.113.42",
      },
      {
        tenantId: sunriseClinic.id,
        actorId: custBob.id,
        actorType: "customer",
        action: "UPDATE",
        entityType: "Appointment",
        entityId: apptCancelled.id,
        before: { status: "CONFIRMED" },
        after: {
          status: "CANCELLED",
          cancelReason: "Patient requested cancellation",
        },
        metadata: { source: "whatsapp", messageId: "wamid_cancel_001" },
      },
      {
        tenantId: sunriseClinic.id,
        actorId: "00000000-0000-0000-0000-000000000000",
        actorType: "system",
        action: "UPDATE",
        entityType: "Appointment",
        entityId: apptNoShow.id,
        before: { status: "CONFIRMED" },
        after: { status: "NO_SHOW" },
        metadata: {
          reason: "Auto-marked no-show after 30 min past start time",
        },
      },
      {
        tenantId: sunriseClinic.id,
        actorId: drChen.id,
        actorType: "staff",
        action: "DELETE",
        entityType: "StaffMember",
        entityId: formerStaff.id,
        before: { fullName: "Dr. Alex Former", isActive: true },
        after: { isActive: false },
        ipAddress: "203.0.113.42",
      },
    ],
  });

  console.log("✅ Audit logs");

  // ═══════════════════════════════════════════════════════════════════════════
  // API KEYS — active / expired / revoked
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.apiKey.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        name: "Production Integration Key",
        keyHash:
          "$2b$10$abcdef1234567890abcdef1234567890abcdef1234567890abcde",
        prefix: "apt_live",
        lastUsedAt: daysAgo(1),
        expiresAt: daysFromNow(365),
      },
      {
        tenantId: sunriseClinic.id,
        name: "Old Test Key",
        keyHash:
          "$2b$10$zyxwvu9876543210zyxwvu9876543210zyxwvu9876543210zyxwv",
        prefix: "apt_test",
        lastUsedAt: daysAgo(60),
        expiresAt: daysAgo(30),
      },
      {
        tenantId: glowSalon.id,
        name: "Revoked Zapier Key",
        keyHash:
          "$2b$10$mnopqr1234567890mnopqr1234567890mnopqr1234567890mnopq",
        prefix: "apt_live",
        revokedAt: daysAgo(7),
      },
    ],
  });

  console.log("✅ API keys");

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTBOUND WEBHOOK CONFIGS + DELIVERIES — active/inactive config,
  //   delivery success / failure / in-progress
  // ═══════════════════════════════════════════════════════════════════════════

  const whConfigActive = await prisma.outboundWebhookConfig.create({
    data: {
      tenantId: sunriseClinic.id,
      url: "https://hooks.zapier.com/hooks/catch/12345/sunrise",
      secret: "whsec_sunrise_zapier_secret_abc123",
      events: [
        "appointment.created",
        "appointment.cancelled",
        "appointment.completed",
      ],
      isActive: true,
    },
  });

  await prisma.outboundWebhookConfig.create({
    data: {
      tenantId: sunriseClinic.id,
      url: "https://old-crm.example.com/webhooks/appointly",
      secret: "whsec_old_crm_secret",
      events: ["appointment.created"],
      isActive: false,
    },
  });

  await prisma.outboundWebhookDelivery.createMany({
    data: [
      {
        configId: whConfigActive.id,
        eventType: "appointment.created",
        payload: {
          event: "appointment.created",
          appointmentId: apptCompleted.id,
        },
        httpStatus: 200,
        response: '{"status":"ok"}',
        attempts: 1,
        succeededAt: daysAgo(5),
      },
      {
        configId: whConfigActive.id,
        eventType: "appointment.cancelled",
        payload: {
          event: "appointment.cancelled",
          appointmentId: apptCancelled.id,
        },
        httpStatus: 500,
        response: "Internal Server Error",
        attempts: 3,
        failedAt: daysAgo(3),
      },
      {
        configId: whConfigActive.id,
        eventType: "appointment.completed",
        payload: {
          event: "appointment.completed",
          appointmentId: salonApptDone.id,
        },
        attempts: 0,
      },
    ],
  });

  console.log("✅ Outbound webhook configs + deliveries");

  // ═══════════════════════════════════════════════════════════════════════════
  // WAITING LIST ENTRIES — waiting / notified / promoted / expired
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.waitingListEntry.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        customerId: custBob.id,
        serviceId: svcSpecialist.id,
        requestedDate: daysFromNow(5),
        position: 1,
      },
      {
        tenantId: sunriseClinic.id,
        customerId: custCarlos.id,
        serviceId: svcSpecialist.id,
        requestedDate: daysFromNow(5),
        position: 2,
      },
      {
        tenantId: glowSalon.id,
        customerId: custSarah.id,
        serviceId: svcColor.id,
        requestedDate: daysFromNow(1),
        position: 1,
        notifiedAt: hoursFromNow(-2),
      },
      {
        tenantId: sunriseClinic.id,
        appointmentId: apptConfirmed.id,
        customerId: custCarlos.id,
        serviceId: svcCheckup.id,
        requestedDate: daysAgo(1),
        position: 1,
        notifiedAt: daysAgo(2),
        promotedAt: daysAgo(1),
      },
      {
        tenantId: sunriseClinic.id,
        customerId: custAnon.id,
        serviceId: svcCheckup.id,
        requestedDate: daysAgo(7),
        position: 1,
        notifiedAt: daysAgo(8),
        expiredAt: daysAgo(7),
      },
    ],
  });

  console.log("✅ Waiting list entries");

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION CONNECTIONS — Google Cal active, Outlook with sync error,
  //   Stripe tenant-level, different tenants
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.integrationConnection.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        staffId: drChen.id,
        type: "GOOGLE_CALENDAR",
        accessToken: "ya29.a0AfH6SMA_fake_access_token",
        refreshToken: "1//0e_fake_refresh_token",
        externalAccountId: "dr.chen@gmail.com",
        tokenExpiresAt: daysFromNow(1),
        isActive: true,
        lastSyncAt: hoursFromNow(-1),
      },
      {
        tenantId: sunriseClinic.id,
        staffId: nursePatel.id,
        type: "OUTLOOK_CALENDAR",
        accessToken: "eyJ0eXAiOiJKV1QiLCJfake_outlook_token",
        refreshToken: "OAQABAAFake_outlook_refresh",
        externalAccountId: "nurse.patel@outlook.com",
        tokenExpiresAt: daysAgo(1),
        isActive: true,
        lastSyncAt: daysAgo(2),
        syncError: "Token expired. Re-authentication required.",
      },
      {
        tenantId: sunriseClinic.id,
        type: "STRIPE",
        externalAccountId: "acct_sunrise_stripe_001",
        isActive: true,
        lastSyncAt: hoursFromNow(-0.5),
      },
      {
        tenantId: glowSalon.id,
        staffId: salonOwner.id,
        type: "GOOGLE_CALENDAR",
        accessToken: "ya29.a0AfH6SMA_fake_salon_token",
        refreshToken: "1//0e_fake_salon_refresh",
        externalAccountId: "maria.santos@gmail.com",
        tokenExpiresAt: daysFromNow(1),
        isActive: true,
        lastSyncAt: hoursFromNow(-3),
      },
    ],
  });

  console.log("✅ Integration connections");

  // ═══════════════════════════════════════════════════════════════════════════
  // FAQS — active / inactive, different thresholds, different tenants
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.faq.createMany({
    data: [
      {
        tenantId: sunriseClinic.id,
        question: "What are your opening hours?",
        answer:
          "We are open Monday to Friday 8 AM to 6 PM, and Saturday 9 AM to 1 PM. Closed on Sundays.",
        similarityThreshold: 0.75,
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        question: "Do you accept insurance?",
        answer:
          "Yes, we accept Aetna, Blue Cross, and United Healthcare. Bring your insurance card to your appointment.",
        similarityThreshold: 0.8,
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        question: "How do I cancel my appointment?",
        answer:
          "Reply CANCEL here on WhatsApp, or use our web dashboard. Please cancel at least 24 hours in advance.",
        similarityThreshold: 0.8,
        isActive: true,
      },
      {
        tenantId: sunriseClinic.id,
        question: "Do you offer COVID testing?",
        answer:
          "We no longer offer COVID testing as of January 2026.",
        similarityThreshold: 0.85,
        isActive: false,
      },
      {
        tenantId: glowSalon.id,
        question: "What is your cancellation policy?",
        answer:
          "Please cancel at least 4 hours before your appointment. Late cancellations may incur a 50% charge.",
        similarityThreshold: 0.7,
        isActive: true,
      },
    ],
  });

  console.log("✅ FAQs");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
