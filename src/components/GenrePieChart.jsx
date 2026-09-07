import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { PIE_COLORS, withChartColors } from '../utils/mediaUtils';
import "./GenrePieChart.css";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload;
  return (
    <div className="pieTooltip">
      <span className="pieTooltipDot" style={{ background: item?.color }} />
      <span className="pieTooltipName">{item?.name}</span>
      <strong>{item?.users}%</strong>
    </div>
  );
}

export default function GenrePieChart({
  data,
  title = "Genre breakdown",
  subtitle,
  height = 280,
}) {
  const colored = withChartColors(data);

  if (!colored.length) {
    return (
      <div className="genrePieEmpty">
        <p>No genre data yet.</p>
      </div>
    );
  }

  return (
    <div className="genrePieCard">
      <div className="genrePieHeader">
        <h3 className="genrePieTitle">{title}</h3>
        {subtitle ? <p className="genrePieSubtitle">{subtitle}</p> : null}
      </div>

      <div className="genrePieBody">
        <div className="genrePieChartWrap" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={colored}
                dataKey="users"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={height * 0.22}
                outerRadius={height * 0.36}
                paddingAngle={2}
                stroke="var(--panel-bg)"
                strokeWidth={2}
              >
                {colored.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="genrePieLegend">
          {colored.map((entry) => (
            <li key={entry.name} className="genrePieLegendItem">
              <span
                className="genrePieLegendSwatch"
                style={{ background: entry.color }}
              />
              <span className="genrePieLegendName">{entry.name}</span>
              <span className="genrePieLegendValue">{entry.users}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
