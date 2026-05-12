# تحریر (Tehreer) — An Intelligent Urdu PDF Reader

**Tehreer** (meaning *writing* or *text* in Urdu) is a premium mobile experience designed for the modern Urdu reader. It bridges the gap between traditional reading and modern AI assistance, offering a seamless, high-fidelity PDF reading environment with integrated contextual intelligence.

## Key Features

- **High-Fidelity Reading**: Experience PDFs with pixel-perfect clarity using a modern PDF.js-based rendering engine, optimized for mobile devices.
- **Contextual Meaning Lookup**: Simply tap any word or select a phrase to get its precise Urdu meaning in context. No more switching between apps or dictionaries.
- **AI-Powered Summarization**: Generate concise summaries of specific page ranges. Perfect for quickly grasping the essence of long chapters or documents.
- **Personal Dictionary**: Save difficult words and their meanings to your own library for future reference and learning.
- **Premium Urdu Typography**: Native support for **Noto Nastaliq Urdu**, ensuring that Urdu text looks as beautiful as it is intended to be.
- **Optional Authentication**: Read and summarize freely as a guest. Sign in only when you want to sync your personal dictionary across devices.

## Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **PDF Engine**: [PDF.js](https://mozilla.github.io/pdf.js/) via `react-native-webview` for high-fidelity text layer interaction.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Networking**: [Axios](https://axios-http.com/)
- **Styling**: Native StyleSheet API with a custom design system.
- **Font**: [Noto Nastaliq Urdu](https://fonts.google.com/specimen/Noto+Nastaliq+Urdu)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Expo Go](https://expo.dev/go) app on your mobile device OR a configured Android/iOS emulator.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/haider-sh/Tehreer.git
   cd Tehreer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your backend API URL:
   ```env
   EXPO_PUBLIC_API_BASE_URL=https://your-api-endpoint.com
   ```

4. **Start the development server**:
   ```bash
   npx expo start
   ```

## 📂 Project Structure

- `app/`: Expo Router directory containing all screens and layouts.
- `components/`: Reusable UI components including the PDF viewer and Urdu text wrappers.
- `services/`: API client and business logic services.
- `store/`: Zustand stores for global state management.
- `constants/`: Theme configuration, colors, and font constants.
- `assets/`: Images, fonts, and other static files.

## ⚖️ License

This project is private and intended for personal use. All rights reserved.

---

Developed with ❤️ for the Urdu community.
