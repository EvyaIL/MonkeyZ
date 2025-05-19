import { useEffect, useState } from "react";
import { useGlobalProvider } from "../../context/GlobalProvider";
import Role from "../../components/lib/models";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { apiService } from "../../lib/apiService";
import DashboardSidebar from "./DashboardSidebar";

const formatCurrency = (value) => `$${new Intl.NumberFormat().format(value)}`;

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { token, user } = useGlobalProvider();
    
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [activeTab, setActiveTab] = useState("dashboard");

    useEffect(() => {
        if (!token || !user || user.role !== Role.MANAGER) navigate("/");
    }, [token, user, navigate]);

    useEffect(() => {
        fetchStatistics();
    }, []);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            apiService.setToken(token)
            const { data, error } = await apiService.get("/sales/statistics");

            if (error) throw new Error(error);
            
            setStatistics(data);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const revenueData = [
        { period: "All Time", revenue: statistics?.revenue?.all_time || 0 },
        { period: "This Week", revenue: statistics?.revenue?.week || 0 },
        { period: "This Month", revenue: statistics?.revenue?.month || 0 },
    ];

    const mostSoldData = ["all_time", "week", "month"]
        .map((period) => {
            return statistics?.most_sold?.[period]?.map((product) => ({
                name: product.name,
                total_sold: product.total_sold,
                period: period.replace("_", " ").toUpperCase(),
            }));
        })
        .flat()
        .filter(Boolean);

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center p-10">
            <h1 className="text-accent font-bold text-4xl mb-8">Manager Dashboard</h1>

            <div className="flex flex-col md:flex-row w-full max-w-7xl bg-secondary rounded-lg shadow-lg overflow-hidden">
                <DashboardSidebar activeTab={activeTab} />

                <main className="w-full p-10">
                    <h2 className="text-accent font-semibold text-2xl mb-4">
                        Welcome, {user?.username || "Manager"}
                    </h2>
                    <p className="text-white">
                        Manage your products, keys, and view statistics in one place.
                    </p>

                    <div className="mt-6 bg-primary p-6 rounded-lg border border-accent text-center text-white">
                        {loading ? (
                            <p>Loading statistics...</p>
                        ) : errorMessage ? (
                            <p className="text-red-500">{errorMessage}</p>
                        ) : (
                            <>
                                <div className="mt-6 bg-secondary shadow-lg p-6 rounded-lg border border-accent">
                                    <h3 className="text-lg font-semibold mb-4 text-white">💰 Revenue Overview</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={revenueData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" stroke="#fff" />
                                            <YAxis stroke="#fff" tickFormatter={formatCurrency} />
                                            <Tooltip formatter={formatCurrency} />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="url(#gradientRevenue)" barSize={50} radius={[10, 10, 0, 0]} />
                                            <defs>
                                                <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4CAF50" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#4CAF50" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-6 bg-secondary shadow-lg p-6 rounded-lg border border-accent">
                                    <h3 className="text-lg font-semibold mb-4 text-white">🔥 Top-Selling Products</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={mostSoldData} barCategoryGap="20%">
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" stroke="#fff" />
                                            <YAxis stroke="#fff" />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="total_sold" fill="url(#gradientSales)" barSize={50} radius={[10, 10, 0, 0]} />
                                            <defs>
                                                <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#FFA500" stopOpacity={0.8} />
                                                    <stop offset="100%" stopColor="#FFA500" stopOpacity={0.2} />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ManagerDashboard;
