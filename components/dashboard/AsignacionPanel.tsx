'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface ParroquiaStat {
  nombre: string;
  asignadas: number;
  faltantes: number;
}

interface AsignacionPanelProps {
  totalJuntas: number;
  juntasAsignadas: number;
  totalColaboradores: number;
  parroquiasStats: ParroquiaStat[];
}

export default function AsignacionPanel({
  totalJuntas,
  juntasAsignadas,
  totalColaboradores,
  parroquiasStats
}: AsignacionPanelProps) {
  const juntasFaltantes = Math.max(0, totalJuntas - juntasAsignadas);
  
  const gaugeDataJuntas = [
    { name: 'Asignadas', value: juntasAsignadas },
    { name: 'Faltantes', value: juntasFaltantes }
  ];

  // Colors
  const COLORS = ['var(--color-primary)', 'var(--color-surface-2)'];
  const BAR_COLORS = {
    asignadas: 'var(--color-success)',
    faltantes: 'var(--color-danger)'
  };

  const renderCustomizedLabel = ({ cx, cy, percent, index }: { cx?: number; cy?: number; percent?: number; index?: number }) => {
    if (index !== 0 || cx === undefined || cy === undefined || percent === undefined) return null; // Only show for "Asignadas"
    return (
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="var(--color-text)" fontSize={24} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
        Panel de Asignación
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Gauge: Juntas Asignadas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Juntas Asignadas
          </h3>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeDataJuntas}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  stroke="none"
                >
                  {gaugeDataJuntas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`${value} juntas`, '']}
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  itemStyle={{ color: 'var(--color-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 2rem', marginTop: '-20px' }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>0</span>
             <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{totalJuntas} total</span>
          </div>
        </div>

        {/* Info: Colaboradores Asignados */}
        {/* Currently we don't have a total goal for collaborators, so a gauge is tricky. 
            We'll display the count, maybe against a hypothetical target or just as a stat.
            The prompt says "Gauge chart". We need a "total" to make a gauge full.
            Let's use a gauge where "full" is totalJuntas * 2 (assuming 2 people per junta ideally, or something similar,
            but since we don't know, we'll just show a gauge of Total Colaboradores vs Total Juntas as a proxy, 
            or if there's no fixed total, a different visualization).
            Let's use totalJuntas as a proxy for "needed collaborators" if it's 1-to-1, or we just show a semi-circle with the number.
        */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            Colaboradores Asignados
          </h3>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ name: 'Colaboradores', value: totalColaboradores }, { name: 'Restante', value: Math.max(0, (totalJuntas || 100) - totalColaboradores) }]}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#a78bfa" />
                  <Cell fill="var(--color-surface-2)" />
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}`, '']}
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '-45px', textAlign: 'center' }}>
             <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{totalColaboradores}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '25px', textAlign: 'center' }}>
            Total registrados
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart: Asignación por Parroquia */}
      <div className="card" style={{ width: '100%', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Asignación por Parroquia
        </h3>
        <div style={{ height: 400, minWidth: '600px' }}>
          {parroquiasStats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={parroquiasStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis 
                  dataKey="nombre" 
                  stroke="var(--color-text-muted)" 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  stroke="var(--color-text-muted)" 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  itemStyle={{ color: 'var(--color-text)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="asignadas" name="Juntas Asignadas" stackId="a" fill={BAR_COLORS.asignadas} />
                <Bar dataKey="faltantes" name="Juntas Faltantes" stackId="a" fill={BAR_COLORS.faltantes} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              No hay datos de parroquias disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
