import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { apiService } from '../../../lib/apiService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Create component as a named function expression
const AdminOverview = function AdminOverviewComponent() {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [analytics, setAnalytics] = React.useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
  });

  React.useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        const { data } = await apiService.get('/admin/analytics');
        setAnalytics({
          totalSales: data?.totalSales || 0,
          totalOrders: data?.totalOrders || 0,
          averageOrderValue: data?.averageOrderValue || 0,
          dailySales: data?.dailySales || [],
        });
      } catch (error) {
        console.error('Error loading analytics:', error);
        // Set default values on error
        setAnalytics({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          dailySales: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  const chartData = {
    labels: analytics.dailySales?.map(sale => sale.date) || [],
    datasets: [
      {
        label: t('admin.dailySales'),
        data: analytics.dailySales?.map(sale => sale.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Analytics Cards */}
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalSales')}</h3>
          <p className="text-2xl font-bold text-accent">₪{analytics.totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalOrders')}</h3>
          <p className="text-2xl font-bold text-accent">{analytics.totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.averageOrder')}</h3>
          <p className="text-2xl font-bold text-accent">₪{analytics.averageOrderValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-4">{t('admin.salesTrends')}</h3>
        <div className="h-64">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
              plugins: {
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Export the component both as default and named export
export { AdminOverview };
export default AdminOverview;
