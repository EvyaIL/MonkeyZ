import { Link } from "react-router-dom";

const DashboardSidebar = ({ activeTab }) => {
    const navLinks = [
        { path: "/dashboard", label: "📊 Statistics" },
        { path: "/dashboard/products", label: "🛍 Products" },
    ];

    return (
        <aside className="w-full md:w-1/4 bg-gray-900 text-white p-6 flex flex-col">
            <h3 className="text-xl font-semibold mb-6 tracking-wide">Navigation</h3>
            <nav className="space-y-2">
                {navLinks.map(({ path, label }) => (
                    <Link key={path} to={path}>
                        <button
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all font-medium
                                ${activeTab === path ? "bg-blue-500 text-white shadow-md" : "bg-gray-800 hover:bg-gray-700"}`}
                        >
                            {label}
                        </button>
                    </Link>
                ))}
            </nav>
        </aside>
    );
};

export default DashboardSidebar;
