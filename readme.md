# BloodCare Client (Frontend)

React + Vite frontend for the BloodCare blood donation management system.  
Donors, volunteers, and admins can search donors, manage blood donation requests, and handle funding via Stripe.

---

## 🔗 Live Demo

**Client Live URL:**  
👉 https://give-a-life.netlify.app/

---

## Features

- **Public**
  - Landing page with hero, stats, and featured sections
  - View all **pending** blood donation requests
  - Contact form (sends message to backend)
  - Responsive navigation, dark/light theme toggle
- **Authentication**
  - Email/password login & registration (Firebase Auth)
  - Avatar upload via ImgBB during registration
  - Forgot password flow (separate screen)
- **Donor dashboard**
  - Personalized dashboard home with recent donation requests
  - Create, edit, delete own donation requests
  - Track status: `pending`, `inprogress`, `done`, `canceled`
  - View assigned donor info when someone accepts the request
- **Volunteer / Admin dashboard**
  - Role-based navigation (donor / volunteer / admin)
  - Global overview cards: total users, total funding, total requests
  - Admin: manage all users (block/unblock, change role)
  - Admin + Volunteer: manage **all** donation requests, update status
- **Funding**
  - Secure Stripe Card payment (client + server)
  - View list of all funds with amount and date
- **Profile**
  - Dashboard profile (DB user data: blood group, district, upazila)
  - Public “My Profile” page for Firebase name / photo update
- **UX**
  - Tailwind + DaisyUI + Lottie animations
  - Mobile-first responsive layout
  - Toast notifications and inline validation

---

## Tech Stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [React Router DOM](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/) + [daisyUI](https://daisyui.com/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Stripe](https://stripe.com/) (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- [Axios](https://axios-http.com/) (via custom `useAxiosSecure` hook)
- [Lottie-react](https://github.com/Gamote/lottie-react)
- React Icons

---

## Prerequisites

- Node.js **>= 18**
- npm or yarn
- A running backend API (see server README)
- Firebase project for Auth
- Stripe account + publishable key
- ImgBB account + API key

---

## Environment Variables

Create `.env.local` (or `.env` for local only) in the client root:

```bash
VITE_API_BASE_URL=http://localhost:3000  # or your deployed API URL
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# ImgBB
VITE_IMGBB_API_KEY=your_imgbb_api_key


