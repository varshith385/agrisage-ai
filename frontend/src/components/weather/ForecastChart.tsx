import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DailyForecastItem } from '../../types/api';
import { useTranslation } from '../../context/LanguageContext';

interface ForecastChartProps {
  data: DailyForecastItem[];
  className?: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data, className = '' }) => {
  const { t } = useTranslation();

  const formattedData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    maxTemp: d.temp_max_c,
    minTemp: d.temp_min_c,
    rainfall: d.precipitation_sum_mm,
    et0: d.reference_et0_mm,
    rainProb: d.precipitation_probability_pct,
  }));

  return (
    <div className={`bg-white border border-agri-soil-200/80 rounded-2xl p-5 shadow-warm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-base font-bold text-stone-900">
            {t('location.forecast_heading')}
          </h3>
          <p className="text-xs text-stone-500 font-medium">
            Daily Temperature Range (°C), Evapotranspiration (mm), and Rainfall (mm)
          </p>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1ece4" />
            <XAxis dataKey="date" stroke="#78716c" fontSize={11} tickLine={false} />
            <YAxis yAxisId="temp" stroke="#d97706" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} unit="°C" />
            <YAxis yAxisId="water" orientation="right" stroke="#0284c7" fontSize={11} unit="mm" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#faf8f5',
                borderColor: '#e8e2d8',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar yAxisId="water" dataKey="rainfall" name="Expected Rain (mm)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            <Line yAxisId="temp" type="monotone" dataKey="maxTemp" name="Max Temp (°C)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="temp" type="monotone" dataKey="minTemp" name="Min Temp (°C)" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="water" type="monotone" dataKey="et0" name="ET0 Water Demand (mm)" stroke="#16a34a" strokeWidth={2} strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

