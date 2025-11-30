import { getServerAuthSession } from "@/lib/getServerAuth";

function DashboardPage() {
    const session = getServerAuthSession()

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <h2 className="text-2xl font-bold">Please sign in to access the dashboard. <span><a href="auth/signin">signin</a></span></h2>
            </div>
        );
    }
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Welcome to your dashboard! Here you can find an overview of your analytics.</p>
        </div>
    );
}

export default DashboardPage;