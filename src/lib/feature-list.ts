
import { LayoutDashboard, QrCode, Users, MenuSquare, IndianRupee, Package, Briefcase, CalendarCheck, Activity, Megaphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    title: string;
    description: string;
    href: string;
    featureSections: { title: string; description: string; }[];
}

export const allFeatures: Feature[] = [
    {
        icon: LayoutDashboard,
        title: "Centralized Admin Dashboard",
        description: "A real-time overview of your entire hotel. Monitor room status, live service queues, and key metrics from one screen.",
        href: "/features/centralized-dashboard",
        featureSections: [
            {
                title: "Real-Time Hotel Snapshot",
                description: "The moment you log in, you're presented with a live overview of your hotel's status. Key performance indicators such as occupancy, arrivals, departures, and pending service requests are displayed prominently, allowing for quick assessment and immediate action. This eliminates the need to switch between different systems or reports, saving valuable time.",
            },
            {
                title: "Upcoming Guest Movements",
                description: "Stay ahead of the day's activities with the 'Upcoming Movements' card. It provides a clear, chronological list of all scheduled arrivals and departures, enabling front-desk staff to prepare for check-ins, manage room assignments, and anticipate guest needs proactively.",
            },
            {
                title: "Live Room Status Grid",
                description: "Visualize the state of every room in your hotel at a glance. The grid uses a clear, color-coded system to indicate whether a room is occupied, available, requires cleaning, or is out of order. This real-time view is crucial for housekeeping coordination and maximizing room occupancy.",
            },
            {
                title: "Actionable Service Queue",
                description: "The dashboard includes a condensed, live feed of all pending service requests, from in-room dining to maintenance issues. This ensures that no guest request is overlooked and allows managers to monitor response times and operational efficiency directly from the main screen.",
            },
        ]
    },
    {
        icon: QrCode,
        title: "Instant Guest Portal",
        description: "Guests scan a QR code in their room to instantly access in-room dining, service requests, bill tracking, and local guides.",
        href: "/features/guest-portal",
        featureSections: [
            {
                title: "Frictionless Access",
                description: "No app downloads, no complicated logins. Guests simply scan a unique QR code in their room with their smartphone to securely and instantly access the portal. This ease of access ensures high adoption and usage rates throughout their stay.",
            },
            {
                title: "Comprehensive Service Hub",
                description: "The portal is a one-stop-shop for all guest needs. They can browse restaurant menus and place in-room dining orders, request amenities like extra towels or laundry service, and report maintenance issues, all without picking up the phone. Service availability is updated in real-time based on your configured operational hours.",
            },
            {
                title: "AI-Powered Local Explorer",
                description: "Offer guests a personalized concierge service powered by AI. They can make natural language requests (e.g., 'Find a quiet cafe nearby') to get tailored recommendations for local restaurants, attractions, and activities, enhancing their travel experience.",
            },
            {
                title: "Real-Time Bill Tracking",
                description: "Provide complete transparency and convenience with live bill tracking. Guests can view an itemized list of all charges accrued during their stay at any time, reducing front-desk inquiries and ensuring a smooth, surprise-free check-out process.",
            },
        ]
    },
    {
        icon: Users,
        title: "Comprehensive Team Management",
        description: "Manage departments, shifts, attendance, and member roles. Assign tasks and monitor performance with detailed analytics.",
        href: "/features/team-management",
        featureSections: [
            {
                title: "Role-Based Access Control",
                description: "Create detailed profiles for every team member and assign them specific roles (e.g., Admin, Manager, Reception, Member). This ensures that staff can only access the features and data relevant to their responsibilities, enhancing security and simplifying their user experience.",
            },
            {
                title: "Department & Shift Management",
                description: "Structure your workforce logically by creating departments (e.g., Housekeeping, F&B, Front Desk) and defining custom work shifts. Assign team members to their respective departments and shifts to ensure proper task routing and accurate attendance tracking.",
            },
            {
                title: "Automated Task Routing",
                description: "Link service categories directly to the departments that manage them. When a guest requests a service, the system automatically routes the task to the correct departmental queue (e.g., a laundry request goes to Housekeeping), eliminating manual dispatching and speeding up response times.",
            },
            {
                title: "Performance & Attendance Analytics",
                description: "Gain insights into your team's operational efficiency. The analytics dashboard provides detailed reports on tasks completed, average completion times, and SLA breach rates, filterable by team member or department. You can also view and export historical attendance records for payroll and performance reviews.",
            },
        ]
    },
    {
        icon: MenuSquare,
        title: "Advanced Room & Service Config",
        description: "Bulk-create rooms, use our AI Menu Scanner to digitize F&B menus, and configure service timings with ease.",
        href: "/features/room-service-config",
        featureSections: [
            {
                title: "AI-Powered Menu Digitization",
                description: "Transform your printed food and beverage menus into a digital, order-ready format in seconds. Simply upload an image of your menu, and our AI Menu Extractor will analyze it, identify items, descriptions, and prices, and populate them into your system, saving hours of manual data entry.",
            },
            {
                title: "Flexible Room & Category Management",
                description: "Define your hotel's inventory with granular control. Create distinct room categories with unique base prices and descriptions. Then, use the bulk-add feature to create hundreds of individual rooms and assign them to their respective categories in a single operation. You can also generate unique QR codes for each room directly from the management table.",
            },
            {
                title: "Dynamic Service Creation",
                description: "Build a comprehensive service catalog that goes beyond food. Create custom categories for any service you offer, such as 'Laundry', 'Spa', 'Transportation', or 'Business Services'. For each service, you can define its name, price, and description, making it instantly available to guests or for staff to use in manual charges.",
            },
            {
                title: "Operational Hours Control",
                description: "Define precisely when your services are available. The Service Timings manager allows you to set specific operational hours for each restaurant and service category. This ensures that guests can only order or request services that are actively available, preventing operational conflicts and managing guest expectations.",
            },
        ]
    },
    {
        icon: IndianRupee,
        title: "Billing & Revenue Analytics",
        description: "Manage corporate client billing, track payments, and get deep insights into revenue streams and itemized sales data.",
        href: "/features/billing-revenue",
        featureSections: [
            {
                title: "Holistic Revenue Tracking",
                description: "Go beyond simple sales numbers. The analytics dashboard aggregates revenue from all sources—room charges, in-room dining, services, and corporate accounts—into a single, cohesive view. Track performance over any date range, identify your most profitable services, and understand your revenue streams with unprecedented clarity.",
            },
            {
                title: "Corporate Client Management",
                description: "Effortlessly manage your B2B relationships. Create dedicated profiles for corporate clients, including their contact details and GST information. When a guest checks out, you can assign their bill directly to the corporate account for consolidated, end-of-month invoicing, simplifying the payment process for your most valuable partners.",
            },
            {
                title: "Actionable Financial Insights",
                description: "The dashboard doesn't just show data; it provides actionable insights. Visualize revenue trends over time, analyze the performance of different room categories, and see a detailed breakdown of service-related income. Use these insights to optimize pricing, promote high-margin services, and make informed decisions that drive profitability.",
            },
            {
                title: "Automated Tax & Charge Calculation",
                description: "Eliminate manual calculation errors. The system automatically applies pre-configured GST and service charge rates to every bill, ensuring accuracy and compliance. All financial reports and invoices reflect these calculations, providing a clear and transparent breakdown for both guests and your accounting team.",
            },
        ]
    },
    {
        icon: Package,
        title: "Full Inventory Control",
        description: "Track stock levels, manage vendors, set par levels for low-stock alerts, and create cleaning checklists for inventory consumption.",
        href: "/features/inventory-control",
        featureSections: [
            {
                title: "Centralized Item & Vendor Management",
                description: "Maintain a complete digital catalog of all your inventory items, organized by category. Alongside, manage a database of your suppliers, including their contact details and the categories of items they provide, creating a single source of truth for your procurement and stock management.",
            },
            {
                title: "Automated Stock Deduction",
                description: "Link inventory items directly to your hotel services. When a guest orders a menu item or a cleaning task is completed, the system automatically deducts the associated consumables from your stock count. This provides a real-time, accurate view of your inventory levels without manual tracking.",
            },
            {
                title: "Proactive Low-Stock Alerts",
                description: "Set 'par levels' for each item to define minimum required stock. The system automatically flags any item that falls below its par level, allowing you to proactively reorder supplies and prevent stockouts of critical items before they impact guest experience or operations.",
            },
            {
                title: "Complete Movement History",
                description: "Gain full visibility into your stock flow with a detailed movement log. Every restock, consumption, and manual adjustment is recorded with a timestamp, item details, and notes, providing a transparent and auditable history of all inventory transactions.",
            },
        ]
    },
    {
        icon: Briefcase,
        title: "Franchise Owner Portfolio",
        description: "Oversee multiple properties from a single dashboard. Compare performance, track revenue, and gain high-level insights with secure, read-only access.",
        href: "/features/franchise-portfolio",
        featureSections: [
            {
                title: "Portfolio-Wide Analytics",
                description: "Log in to a dedicated dashboard that aggregates key performance indicators from all your hotels. Compare revenue, occupancy rates, and other critical metrics across different properties in a single, intuitive interface. Identify top-performing assets and pinpoint areas needing attention at a glance.",
            },
            {
                title: "Secure, Delegated Access",
                description: "Maintain control and security across your organization. Hotel administrators can grant secure, read-only analytical access to franchise owners on a per-hotel basis. This delegation system ensures that portfolio managers have the data they need without compromising the operational integrity or security of individual hotel instances.",
            },
            {
                title: "Simplified Access Requests",
                description: "Franchise owners can proactively request access to new properties directly through the portal. The system sends a notification to the hotel administrator, who can approve or deny the request with a single click, streamlining the process of expanding your portfolio view.",
            },
            {
                title: "Strategic Decision-Making Tool",
                description: "The portfolio view is more than just a report; it's a strategic tool. Use the aggregated data to understand regional trends, evaluate the effectiveness of chain-wide promotions, and make informed investment and management decisions that maximize the profitability of your entire hotel group.",
            },
        ]
    },
    {
        icon: CalendarCheck,
        title: "Dynamic Reservations & Occupancy",
        description: "Visualize bookings on a real-time grid, create group bookings with CSV upload, and instantly check occupancy rates for any date.",
        href: "/features/reservations-occupancy",
        featureSections: [
            {
                title: "Interactive Availability Grid",
                description: "Visualize your hotel's entire inventory on a timeline-based calendar. The grid provides a clear, color-coded view of room availability, existing bookings, and out-of-order blocks. Staff can quickly identify open slots and click directly on the grid to initiate a new reservation.",
            },
            {
                title: "Streamlined Group Bookings",
                description: "Save hours of manual data entry when handling large reservations. Create a group booking profile and then assign guests to multiple rooms by simply uploading a CSV file with guest names and room numbers. The system handles the rest, creating individual stay records linked to the group.",
            },
            {
                title: "Instant Occupancy Statistics",
                description: "Make informed pricing and staffing decisions with the Occupancy Check feature. Select any date—past, present, or future—to get an immediate, real-time calculation of your hotel's occupancy rate, breaking it down by room category for more granular insights.",
            },
            {
                title: "Flexible Stay Management",
                description: "Adapt to changing guest plans with ease. Click on any existing booking in the grid to open the Manage Stay sheet, where you can modify dates, update guest details, change the assigned room, or process a cancellation, all within a single, intuitive interface.",
            },
        ]
    },
    {
        icon: Activity,
        title: "Live Operations & SLA Monitoring",
        description: "Track service requests in a live queue, monitor SLA breach indicators, and respond instantly to guest SOS alerts that notify all staff.",
        href: "/features/live-operations",
        featureSections: [
            {
                title: "Real-Time Service Queue",
                description: "View every guest and internal service request as it happens in a dynamic, filterable table. Track requests from 'Pending' to 'In Progress' to 'Completed'. This centralized view ensures that no task is missed and that all departments have visibility into the current operational workload.",
            },
            {
                title: "SLA Breach Indicators",
                description: "Define Service Level Agreements (SLAs) for different service categories to maintain high standards. The system automatically monitors the age of each request and prominently flags any task that breaches its defined time limit, allowing managers to intervene and prioritize effectively.",
            },
            {
                title: "Integrated Task Assignment",
                description: "Empower managers to act directly from the queue. Assign or re-assign tasks to specific team members within the appropriate department. This ensures clear ownership and accountability for every request, from in-room dining to emergency maintenance.",
            },
            {
                title: "Global SOS Emergency System",
                description: "Enhance guest safety with an integrated SOS button in the Guest Portal. When a guest triggers an alert, all staff-facing interfaces display an immediate, high-priority notification and a persistent pulsing alert, ensuring rapid response to critical incidents.",
            },
        ]
    },
    {
        icon: Megaphone,
        title: "Guest-Facing Marketing",
        description: "Engage with guests by creating and scheduling targeted announcements and special offers directly to their devices based on room type or stay dates.",
        href: "/features/guest-marketing",
        featureSections: [
            {
                title: "Dynamic Broadcast Creation",
                description: "Create compelling announcements using a simple yet powerful interface. Craft a title and message, and choose how and when it should appear. Broadcasts are displayed as eye-catching banners within the Guest Portal, ensuring high visibility.",
            },
            {
                title: "Advanced Scheduling & Targeting",
                description: "Maximize relevance and impact with sophisticated scheduling options. Configure broadcasts to run on specific dates for one-time events, or set them to recur daily within certain time windows (e.g., for a daily happy hour promotion). You can even target announcements to specific room categories, allowing you to tailor offers to different guest segments.",
            },
            {
                title: "Drive Ancillary Revenue",
                description: "Use broadcasts to actively promote your hotel's services and boost ancillary revenue. Announce restaurant specials, spa discounts, or late check-out offers directly to guests who are most likely to be interested, converting their attention into sales.",
            },
            {
                title: "Enhance Guest Communication",
                description: "Beyond promotions, the broadcast system is a powerful tool for operational communication. Inform guests about scheduled maintenance, upcoming events at the hotel, or provide helpful daily information like the weather forecast, enhancing their overall experience and keeping them informed.",
            },
        ]
    }
];
