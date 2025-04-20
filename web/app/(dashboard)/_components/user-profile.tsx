import { UserButton, useUser } from "@clerk/nextjs"

function UserProfile() {
  const { user } = useUser();
  const userName = user?.fullName || "User";
  const userEmail = user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="flex gap-2 items-center py-5">
      <UserButton />
      <div className="flex flex-col w-full pr-8">
        <p className="text-sm truncate">{ userName }</p>
        <p className="text-sm text-gray-600 truncate">{ userEmail }</p>
      </div>
    </div>
  )
}

export default UserProfile