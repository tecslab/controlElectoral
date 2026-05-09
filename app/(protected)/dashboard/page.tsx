import { createClient } from '@/lib/supabase/server'
import AsignacionPanel from '@/components/dashboard/AsignacionPanel'

export const metadata = { title: 'Dashboard — Control Electoral' }

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch real data for stats
  const [
    { count: totalColaboradores },
    { count: totalRecintos },
    { count: totalParroquias },
    { count: totalJuntasCubiertas },
    { count: totalJuntas },
    { data: parroquiasAsignacion }
  ] = await Promise.all([
    supabase.from('colaboradores').select('*', { count: 'exact', head: true }),
    supabase.from('recintos').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('parroquias').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('asignacion_juntas').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
    supabase.from('juntas').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
    (supabase.rpc as any)('get_parroquias_asignacion_stats') // Fallback handled below if data is null
  ])

  // Get raw data for parroquias to compute stats if RPC fails or doesn't exist
  let parroquiasStats = parroquiasAsignacion;
  
  if (!parroquiasStats || parroquiasStats.length === 0) {
    const { data: recintosData } = await supabase
      .from('recintos')
      .select(`
        id, id_parroquia,
        parroquias!recintos_id_parroquia_fkey(nombre),
        juntas!juntas_id_recinto_fkey(
          id,
          asignacion_juntas!asignacion_juntas_id_junta_fkey(id, estado)
        )
      `)
      .eq('estado', 'Activo');

      type RecintoData = { 
        id: string; 
        id_parroquia: string; 
        parroquias: { nombre: string } | null;
        juntas: { id: string, asignacion_juntas: { id: string, estado: string }[] }[] 
      };

      const statsMap = new Map();
      if (recintosData) {
        (recintosData as unknown as RecintoData[]).forEach((recinto) => {
          const parroquiaNombre = recinto.parroquias?.nombre || 'Desconocida';
          if (!statsMap.has(parroquiaNombre)) {
            statsMap.set(parroquiaNombre, { nombre: parroquiaNombre, asignadas: 0, faltantes: 0 });
          }
          
          const stat = statsMap.get(parroquiaNombre);
          const juntas = recinto.juntas || [];
          
          juntas.forEach((junta) => {
            const hasActiveAsignacion = junta.asignacion_juntas?.some((a) => a.estado === 'Activo');
            if (hasActiveAsignacion) {
              stat.asignadas += 1;
            } else {
              stat.faltantes += 1;
            }
          });
        });
      }
      parroquiasStats = Array.from(statsMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen general del evento electoral</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        {[
          { label: 'Total Colaboradores', icon: '👥', color: 'var(--color-primary)', value: totalColaboradores ?? 0 },
          { label: 'Recintos', icon: '🏫', color: '#a78bfa', value: totalRecintos ?? 0 },
          { label: 'Parroquias', icon: '🏘️', color: 'var(--color-success)', value: totalParroquias ?? 0 },
          { label: 'Juntas Cubiertas', icon: '✅', color: 'var(--color-warning)', value: totalJuntasCubiertas ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '12px',
              background: `${stat.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <AsignacionPanel 
        totalJuntas={totalJuntas ?? 0} 
        juntasAsignadas={totalJuntasCubiertas ?? 0}
        totalColaboradores={totalColaboradores ?? 0}
        parroquiasStats={parroquiasStats}
      />
    </div>
  )
}
