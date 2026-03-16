
# DokanBD (দোকানবিডি) - Modern Multi-tenant E-commerce SaaS

**DokanBD** is a high-performance, AI-integrated multi-tenant e-commerce platform designed to empower entrepreneurs to launch their own online stores without any coding knowledge. Built with Next.js 15, Supabase, and Genkit AI.

## 🚀 Project Overview (Resume Summary)
*   **Role:** Full-Stack Developer / Architect
*   **Tech Stack:** Next.js 15 (App Router), TypeScript, Supabase (Postgres, Auth, Realtime), Tailwind CSS, ShadCN UI, Genkit AI (Gemini), Cloudinary (Media), SSLCommerz & Stripe (Payments), Firebase (Push Notifications).

## 🌟 Key Features

### 1. Advanced Multi-tenancy
* Supports dynamic store creation on custom subdomains (e.g., `store.e-bd.shop`) and external custom domains.
* Individual store owners get a dedicated admin dashboard to manage their specific inventory, customers, and themes.

### 2. GenAI Content Engine
* Integrated **Google Gemini** via Genkit to automatically generate SEO-friendly product descriptions and "Our Story" sections.
* AI-powered "Smart Share" tool to create high-conversion social media posts for products.

### 3. Real-time Customer Experience
* **Live Chat:** Synchronized real-time messaging between store owners and visitors using Supabase Realtime.
* **Order Tracking:** Instant order status updates with progress indicators using transaction IDs or order numbers.
* **Push Notifications:** Native browser notifications for new orders and messages powered by Firebase Cloud Messaging.

### 4. Robust Inventory & Order Management
* Support for multi-variant products (size, weight, color) with independent pricing and stock tracking.
* Automated stock alerts and a comprehensive order fulfillment workflow (Pending -> Processing -> Delivered).

### 5. Seamless Payments
* Integrated with **SSLCommerz** and **Stripe** for automated checkouts.
* Custom manual payment workflows for local mobile banking (bKash, Nagad, Rocket) with admin verification.

## 🛠️ Installation & Setup
1. `npm install`
2. Configure environment variables (Supabase, Cloudinary, OpenAI/Gemini, Stripe).
3. `npm run dev`

Visit `localhost:3000/admin` to see the store dashboard or the root domain to view the SaaS landing page.
