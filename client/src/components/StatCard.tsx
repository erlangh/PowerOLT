type Props = { icon: string; title: string; value: number | string; sub?: string };
export default function StatCard({ icon, title, value, sub }: Props){
  return (
    <div className="card stat-card">
      <div className="stat-icon" aria-hidden>{icon}</div>
      <div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}