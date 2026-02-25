'use client'
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Activity, Cake, ArrowRight, Sun, Moon } from 'lucide-react';

export default function App() {
  const [dob, setDob] = useState('');
  const [ageData, setAgeData] = useState(null);

  const calculateAge = (birthDateString) => {
    if (!birthDateString) {
      setAgeData(null);
      return;
    }

    const birthDate = new Date(birthDateString);
    const today = new Date();

    if (birthDate > today) {
      setAgeData({ error: 'Date of birth cannot be in the future!' });
      return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonthDate.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (today > nextBirthday) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const diffToNextBirthday = nextBirthday.getTime() - today.getTime();
    const daysToNextBirthday = Math.ceil(diffToNextBirthday / (1000 * 3600 * 24));

    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = (years * 12) + months;
    const totalHours = totalDays * 24;

    setAgeData({
      years,
      months,
      days,
      totalMonths,
      totalWeeks,
      totalDays,
      totalHours,
      daysToNextBirthday
    });
  };

  useEffect(() => {
    calculateAge(dob);
  }, [dob]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-indigo-600 p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-indigo-500 p-3 rounded-full mb-4 shadow-lg inline-block">
              <Calendar size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Age Calculator</h1>
            <p className="text-indigo-200 text-sm">Find out exactly how old you are down to the day.</p>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-md mx-auto mb-10">
            <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Enter your Date of Birth
            </label>
            <div className="relative">
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-100 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 transition-all text-lg font-medium text-slate-700"
              />
              <Cake className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
            </div>
          </div>

          {ageData && ageData.error && (
            <div className="text-center p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 font-medium">
              {ageData.error}
            </div>
          )}

          {ageData && !ageData.error && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 ease-out space-y-8">
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                  <div className="text-5xl font-black text-indigo-600 mb-2">{ageData.years}</div>
                  <div className="text-indigo-900/60 font-semibold uppercase tracking-wider text-sm">Years</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                  <div className="text-5xl font-black text-indigo-600 mb-2">{ageData.months}</div>
                  <div className="text-indigo-900/60 font-semibold uppercase tracking-wider text-sm">Months</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                  <div className="text-5xl font-black text-indigo-600 mb-2">{ageData.days}</div>
                  <div className="text-indigo-900/60 font-semibold uppercase tracking-wider text-sm">Days</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{ageData.totalMonths.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Months</div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{ageData.totalWeeks.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Weeks</div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                    <Sun size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{ageData.totalDays.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Days</div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{ageData.totalHours.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Hours</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl text-white flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Cake size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="text-slate-300 text-sm font-medium mb-1">Next Birthday in</div>
                    <div className="text-2xl font-bold">{ageData.daysToNextBirthday} Days</div>
                  </div>
                </div>
                <ArrowRight className="text-slate-400 opacity-50" size={32} />
              </div>

            </div>
          )}

          {!ageData && !dob && (
            <div className="text-center py-12 px-4">
              <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-slate-300" size={40} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Ready to calculate</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Select your date of birth above to see your exact age and other interesting time statistics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}