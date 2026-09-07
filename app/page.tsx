
import NavDrawer from "@/components/NavDrawer";

import Feed from "@/components/Feed";

import { getAllStories } from "@/lib/stories";

export const revalidate = 60; // re-fetch from Supabase at most once a minute

export default async function FeedPage() {

  const stories = await getAllStories();

  return (

    <>

      <NavDrawer />

      <div className="px-5 pt-5.5 pb-4.5 border-b text-center" style={{ borderColor: "var(--border)" }}>

        <div className="font-display text-xl font-semibold max-w-md mx-auto" style={{ color: "var(--text-body)" }}>

          Global moves. Local math.

        </div>

      </div>

      <Feed stories={stories} />

    </>

  );

}

