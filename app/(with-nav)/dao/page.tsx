import { getUserWithRoles } from "../../../lib/auth/getUserWithRoles";
import { getVoteWeight } from "../../../lib/dao/getVoteWeight";

export default async function DaoPage() {
  const auth = await getUserWithRoles();
  if (!auth) return null;

  const weight = getVoteWeight(auth.roles);

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold">DAO Voting</h1>
      <p className="opacity-70 mt-2">
        Your voting power: {weight}
      </p>
    </div>
  );
}
