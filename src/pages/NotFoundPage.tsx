/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Page } from '../types';
import { HelpCircle, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  setCurrentPage: (page: Page) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ setCurrentPage }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-200" id="not-found-page">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        
        {/* Help Circle Icon */}
        <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-500">
          <HelpCircle className="w-8 h-8 text-amber-500 animate-bounce" />
        </div>

        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-950 font-sans">
            404
          </h2>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-wider font-semibold">
            Resource/Lobby Path Not Found
          </p>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed max-w-xs mx-auto">
          The requested university resource page could not be located in our directory. The link may have changed or expired.
        </p>

        {/* Action Panel */}
        <div className="pt-2">
          <button
            id="btn-not-found-back"
            onClick={() => setCurrentPage(Page.LANDING)}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none transition-colors flex items-center justify-center space-x-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Liberal Arts Entrance</span>
          </button>
        </div>

      </div>
    </div>
  );
};
