import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../components/buttons/PrimaryButton";

const Profile = () => {
  const { user, logout, isLoading } = useGlobalProvider();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-accent text-xl">Loading your profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-accent mb-4">Account Required</h1>
        <p className="text-gray-300 mb-4">You must be signed in to view your profile.</p>
        <PrimaryButton title="Sign In" onClick={() => navigate("/sign-in")}/>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] text-center mt-16">
      <section className="bg-secondary p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-accent mb-4" tabIndex={0} aria-label="Profile Page">
          👤 My Account
        </h1>
        <div className="text-white text-left mb-6">
          <div className="mb-2"><span className="font-semibold text-accent">Username:</span> {user.username}</div>
          <div className="mb-2"><span className="font-semibold text-accent">Email:</span> {user.email}</div>
          {user.phone_number && (
            <div className="mb-2"><span className="font-semibold text-accent">Phone:</span> {user.phone_number}</div>
          )}
        </div>
        <PrimaryButton title="Logout" onClick={logout} otherStyle="w-full" />
      </section>
    </main>
  );
};

export default Profile;
