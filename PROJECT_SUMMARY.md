# StayCentral: Project Summary & Feature Overview

## 1. Project Overview

StayCentral is an all-in-one hotel management solution designed to streamline hotel operations and enhance the guest experience. The platform provides a comprehensive suite of tools for hotel staff (admins, reception, team members) and a seamless digital portal for guests, all powered by a real-time database backend.

The core of the application is a centralized dashboard that offers real-time insights and management capabilities for all hotel activities, from room status and bookings to service requests and revenue analytics.

## 2. Technology Stack

-   **Framework**: Next.js 15 with App Router
-   **Language**: TypeScript
-   **UI Components**: ShadCN UI, Radix UI
-   **Styling**: Tailwind CSS
-   **Backend & Database**: **Firebase** (Firestore, Firebase Authentication)
-   **State Management**: React Context API (Decoupled into domain-specific providers)
-   **Generative AI**: Google's Genkit (for features like menu extraction and local recommendations)
-   **Architecture**: Hybrid model using Client Components for interactivity and real-time data, with Server Components for static rendering and Server Actions for specific operations.

---

## 3. Core Architectural Concepts

### A. Real-Time Data Flow with Firebase

The application is built on a modern, real-time architecture using Firebase.
-   **Firestore Database**: Serves as the single source of truth for all application data, including rooms, stays, services, and team information.
-   **Client-Side Fetching**: The frontend uses custom React hooks (`useCollection`, `useDoc`) which subscribe directly to Firestore collections. This ensures that the UI updates instantly and automatically whenever data changes in the database, providing a live and responsive experience.
-   **Firebase Authentication**: Manages user accounts for hotel staff, providing secure, role-based access to the dashboard portals.

### B. Decoupled State Management (Context Providers)

The application's client-side state is managed through a series of decoupled React Context Providers. This architecture isolates state updates and prevents unnecessary re-renders. The providers now wrap our custom Firebase hooks, fetching and providing live data to all components.

-   **`RoomProvider`**: Manages **rooms**, **stays**, and **checkout history** from Firestore.
-   **`ServiceProvider`**: Manages **hotel services**, **restaurants**, **service categories**, and the live **service request queue**.
-   **`TeamProvider`**: Manages **team members**, **departments**, **shifts**, and **SLA rules**.
-   **`BillingProvider`**: Manages **corporate clients** and their billing histories.
-   **`InventoryProvider`**: Manages all **inventory items**, **stock movements**, and **vendors**.
-   **`SettingsProvider`**: Manages hotel-specific configurations.
-   **`StayProvider`**: A specialized provider for the Guest Portal that manages the state for a single guest's stay.

### C. Multi-Tenancy via `hotelId`

-   The application is designed for multi-tenancy, with the `[hotelId]` dynamic segment in the URL structure. This `hotelId` corresponds to a unique document ID in the root `hotels` collection in Firestore.
-   All data is securely partitioned in Firestore based on the `hotelId`.
-   The **`HotelIdProvider`** makes the current `hotelId` from the URL available to all components, ensuring data is scoped per hotel.

---

## 4. Application Structure & Feature Breakdown

### A. Admin, Reception, & Team Portals

These portals provide role-based access to the hotel's operational dashboard.

#### **`/dashboard` - Main Admin Dashboard**

The primary real-time overview of the hotel's status.
-   **Upcoming Movements**: Lists guest arrivals and departures for the day. Staff can check-in guests directly.
-   **Pending Service Queue**: A new section showing a live, condensed list of all service requests with a "Pending" status, enabling immediate administrative oversight.

#### **`/dashboard/reservations` - Reservations & Bookings**

-   **Availability Grid**: Timeline-based calendar showing room availability.
-   **Occupancy Check**: A real-time feature using a Server Action (`getOccupancyStats`) to calculate and display occupancy statistics for any given date.
-   **Create New Booking**: A dedicated form page for creating single or group bookings with CSV upload support for bulk assignments.

#### **`/dashboard/live-activity` - Live Operations**

-   **Live Service Queue**: A real-time, filterable table of all service requests. Features SLA breach indicators and allows managers to assign or reassign tasks to team members.
-   **Global Emergency SOS**: An integrated notification system. When a guest triggers an SOS, all staff-facing headers display an urgent toast notification and a persistent, pulsing alert on the notification bell, ensuring immediate visibility.

#### **`/dashboard/rooms` - Room & Category Management**

-   **Room Category Management**: Define room types, set base prices, and configure cleaning checklists.
-   **Room Management Table**: A full list of all rooms. Staff can add/edit/delete rooms, perform bulk deletions, and generate/download QR codes for the guest portal.

#### **`/dashboard/services` - Service & Menu Management**

-   **Restaurant Management**: Manage kitchens/restaurants and their specific F&B categories.
-   **Service Category Management**: Define and manage categories for non-F&B services (e.g., "Laundry", "SPA"). Includes the ability to safely reassign services when deleting a category.
-   **AI Menu Extractor**: An AI-powered tool to extract menu items from an uploaded image.

#### **`/dashboard/inventory` - Inventory & Stock Control**

-   **Inventory & Vendor Management**: Manage stock levels, par levels, and a list of suppliers.
-   **Low Stock Alerts**: Automatically flags items below their par level.

#### **`/dashboard/team` - Team & Department Management**

-   **Firebase Auth Integration**: Staff are now created as actual users via Firebase Authentication with an email and password.
-   **Department & Shift Management**: Define departments, shifts, and reassign team members when a department is deleted.
-   **Team Analytics**: A new tab providing detailed analytics on team performance, including tasks completed, average completion time, and SLA breaches, filterable by date range.

#### **`/dashboard/billing` & `/dashboard/revenue-analytics`**

-   **Corporate Billing**: Manages corporate clients and their billing, including sending email summaries for selected invoices.
-   **Revenue Calculation**: Total revenue now accurately includes payments from settled corporate bills.
-   **Downloadable Reports**: Users can download a combined PDF report of revenue and service analytics.

### B. Guest Portal (`/guest/[hotelId]/[stayId]`)

A mobile-first web app for guests, now significantly more lightweight and performant.
-   **Secure Login**: Guest login is validated against the `activeStays` collection in Firestore.
-   **Service Hub**: Access to all services. Availability is determined in real-time based on configured service timings.
-   **SOS Button**: A prominent emergency button that triggers the global staff alert system.
-   **Requests Log (`/requests`):** A new page where guests can view the status and history of all their service requests.