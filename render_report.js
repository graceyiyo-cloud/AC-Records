        function renderReport() {
            const container = document.getElementById('reportContainer');
            if (!container) return;
            
            let reportHTML = '';
            let tRev = 0, tExp = 0, tAc = 0, tWm = 0, tWt = 0;
            const yearMap = {};
            const monthMap = {};
            
            allRecords.forEach(r => {
                const rev = parseInt(r.totalAmount) || 0;
                const exp = parseInt(r.assistantPay) || 0;
                const ac = parseInt(r.acCount) || 0;
                const wm = parseInt(r.wmCount) || 0;
                const wt = parseInt(r.wtCount) || 0;
                
                tRev += rev; tExp += exp; tAc += ac; tWm += wm; tWt += wt;
                
                if (!r.bookingTime) return;
                const dateParts = r.bookingTime.split('-');
                if (dateParts.length < 2) return;
                const y = dateParts[0];
                const m = dateParts[0] + '-' + dateParts[1];
                
                if (!yearMap[y]) yearMap[y] = { rev:0, exp:0, ac:0, wm:0, wt:0, count:0 };
                yearMap[y].rev += rev; yearMap[y].exp += exp; yearMap[y].ac += ac; yearMap[y].wm += wm; yearMap[y].wt += wt; yearMap[y].count++;
                
                if (!monthMap[m]) monthMap[m] = { rev:0, exp:0, ac:0, wm:0, wt:0, count:0 };
                monthMap[m].rev += rev; monthMap[m].exp += exp; monthMap[m].ac += ac; monthMap[m].wm += wm; monthMap[m].wt += wt; monthMap[m].count++;
            });
            
            const tNet = tRev - tExp;
            
            reportHTML += `
                <div class="stats-card stats-card-all p-5 text-white">
                    <h2 class="text-xl font-bold mb-4 border-b border-white/20 pb-2 flex items-center gap-2"><i data-lucide="bar-chart" class="w-5 h-5"></i> 歷史總累計</h2>
                    <div class="grid grid-cols-3 gap-3 text-center mb-4 border-b border-white/10 pb-4">
                        <div><p class="text-xs text-white/70">冷氣</p><p class="text-2xl font-bold">${tAc}</p></div>
                        <div><p class="text-xs text-white/70">洗衣機</p><p class="text-2xl font-bold">${tWm}</p></div>
                        <div><p class="text-xs text-white/70">水塔</p><p class="text-2xl font-bold">${tWt}</p></div>
                    </div>
                    <div class="metric-box-grid">
                        <div class="metric-box metric-box-rev"><span class="metric-box-label">總收入</span><span class="metric-box-value">$${tRev.toLocaleString()}</span></div>
                        <div class="metric-box metric-box-exp"><span class="metric-box-label">總支出</span><span class="metric-box-value">$${tExp.toLocaleString()}</span></div>
                        <div class="metric-box metric-box-net"><span class="metric-box-label">總淨利</span><span class="metric-box-value">$${tNet.toLocaleString()}</span></div>
                    </div>
                </div>
            `;
            
            const sortedYears = Object.keys(yearMap).sort().reverse();
            if (sortedYears.length > 0) {
                reportHTML += `<h3 class="font-bold text-slate-700 text-lg mt-6 mb-3 flex items-center gap-2"><i data-lucide="calendar" class="w-5 h-5 text-indigo-500"></i> 各年度統計</h3><div class="space-y-4">`;
                sortedYears.forEach(y => {
                    const d = yearMap[y];
                    reportHTML += `
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="font-bold text-indigo-800 text-lg">${y} 年度</h4>
                            <span class="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">${d.count} 筆紀錄</span>
                        </div>
                        <div class="flex gap-4 text-sm text-slate-600 mb-3 font-medium bg-slate-50 p-2 rounded-xl">
                            <span>冷 ${d.ac}</span><span>洗 ${d.wm}</span><span>水 ${d.wt}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center mt-2">
                            <div class="bg-blue-50/50 p-2 rounded-xl border border-blue-100/50"><div class="text-[10px] text-blue-600/70 font-bold mb-1">收入</div><div class="font-bold text-slate-700">$${d.rev.toLocaleString()}</div></div>
                            <div class="bg-rose-50/50 p-2 rounded-xl border border-rose-100/50"><div class="text-[10px] text-rose-600/70 font-bold mb-1">支出</div><div class="font-bold text-slate-700">$${d.exp.toLocaleString()}</div></div>
                            <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-100"><div class="text-[10px] text-emerald-700 font-bold mb-1">淨利</div><div class="font-bold text-emerald-700">$${(d.rev - d.exp).toLocaleString()}</div></div>
                        </div>
                    </div>`;
                });
                reportHTML += `</div>`;
            }

            const sortedMonths = Object.keys(monthMap).sort().reverse();
            if (sortedMonths.length > 0) {
                reportHTML += `<h3 class="font-bold text-slate-700 text-lg mt-8 mb-3 flex items-center gap-2"><i data-lucide="list" class="w-5 h-5 text-emerald-500"></i> 各月份統計</h3><div class="space-y-3">`;
                sortedMonths.forEach(m => {
                    const d = monthMap[m];
                    reportHTML += `
                    <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <div class="bg-emerald-100 text-emerald-800 font-bold text-sm px-3 py-1.5 rounded-lg border border-emerald-200 tracking-wider">${m}</div>
                            <div class="text-xs text-slate-500 font-medium">冷${d.ac} / 洗${d.wm} / 水${d.wt} (${d.count}筆)</div>
                        </div>
                        <div class="flex gap-4 text-sm whitespace-nowrap">
                            <div class="flex items-center gap-1"><span class="text-slate-400 text-[10px]">收</span><span class="font-bold text-slate-700">$${d.rev.toLocaleString()}</span></div>
                            <div class="flex items-center gap-1"><span class="text-slate-400 text-[10px]">支</span><span class="font-bold text-rose-500">$${d.exp.toLocaleString()}</span></div>
                            <div class="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100"><span class="text-emerald-600 text-[10px] font-bold">淨</span><span class="font-bold text-emerald-700">$${(d.rev - d.exp).toLocaleString()}</span></div>
                        </div>
                    </div>`;
                });
                reportHTML += `</div>`;
            }

            container.innerHTML = reportHTML;
        }
