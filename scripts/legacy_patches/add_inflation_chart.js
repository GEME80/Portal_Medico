const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let code = fs.readFileSync(file, 'utf8');

const regexGeneral = /\{\/\* Ranking de Rotación Total \*\/\}/;

const inflationChartAnual = `{/* Gráfico de Inflación Anual */}
            <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", height: "400px", overflowY: "auto" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", position: "sticky", top: 0, background: "white", zIndex: 10, paddingBottom: "10px" }}>Análisis de Inflación: Incremento de Costos ({selectedYear})</h3>
              <div style={{ height: \`\${Math.max(300, finanzasAnual.topAlertas.length * 40)}px\`, width: "100%" }}>
                {finanzasAnual.topAlertas.length === 0 ? (
                  <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>No se detectaron incrementos de costos en compras de este año. Registra lotes con precios mayores para ver el gráfico.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={finanzasAnual.topAlertas} margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => \`+\${val}%\`} />
                      <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={140} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => \`+\${val.toFixed(1)}%\`} />
                      <Bar dataKey="incremento" name="Incremento %" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Ranking de Rotación Total */}`;

code = code.replace(regexGeneral, inflationChartAnual);

const regexDiario = /\{\/\* Top Ítems del Mes \*\/\}/;

const inflationChartDiario = `{/* Gráfico de Inflación Diario */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Análisis de Inflación: Incremento de Costos (Mes)</h3>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {finanzasDiario.topAlertas.length === 0 ? (
                      <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px", height: "100%" }}>No se detectaron incrementos de costos en este mes.</div>
                    ) : (
                      <BarChart layout="vertical" data={finanzasDiario.topAlertas} margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => \`+\${val}%\`} />
                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={120} />
                        <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => \`+\${val.toFixed(1)}%\`} />
                        <Bar dataKey="incremento" name="Incremento %" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Ítems del Mes */}`;

code = code.replace(regexDiario, inflationChartDiario);

fs.writeFileSync(file, code);
