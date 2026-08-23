/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import { BottomNav } from "./components/BottomNav";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Book } from "./pages/Book";
import { Profile } from "./pages/Profile";

function MainView() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState("home");

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
      {currentTab === "home" && <Home />}
      {currentTab === "book" && <Book onBooked={() => setCurrentTab("home")} />}
      {currentTab === "profile" && <Profile />}
      
      <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-100 flex items-center justify-center sm:p-4">
        <div className="w-full sm:max-w-[400px] h-[100dvh] sm:h-[850px] bg-white sm:rounded-[3rem] sm:border-[8px] border-slate-900 shadow-2xl flex flex-col overflow-hidden relative">
          <MainView />
        </div>
      </div>
    </AuthProvider>
  );
}

